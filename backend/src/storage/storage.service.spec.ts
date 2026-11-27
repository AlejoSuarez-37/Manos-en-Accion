import {
  BadGatewayException,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PDF_RULE, TEAM_IMAGE_RULE } from './image-rules.js';
import { StorageService } from './storage.service.js';
import type { StorageAdapter } from './storage.types.js';

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const imageFile = (buffer: Buffer, size = buffer.length) =>
  ({
    buffer,
    size,
    originalname: 'Mi Foto!.png',
    mimetype: 'image/png',
    fieldname: 'image',
    encoding: '7bit',
    stream: undefined,
    destination: '',
    filename: '',
    path: '',
  }) as unknown as Express.Multer.File;

const pdfFile = (
  buffer: Buffer,
  size = buffer.length,
  originalname = 'programa.pdf',
) =>
  ({
    buffer,
    size,
    originalname,
    mimetype: 'application/pdf',
    fieldname: 'pdf',
    encoding: '7bit',
    stream: undefined,
    destination: '',
    filename: '',
    path: '',
  }) as unknown as Express.Multer.File;

const PDF = Buffer.from('%PDF-1.7\n');

describe('StorageService', () => {
  let uploadMock: ReturnType<typeof vi.fn>;
  let uploadPdfMock: ReturnType<typeof vi.fn>;
  let deleteMock: ReturnType<typeof vi.fn>;
  let service: StorageService;

  beforeEach(() => {
    uploadMock = vi
      .fn()
      .mockResolvedValue({ key: 'clave', url: 'https://cdn/clave' });
    uploadPdfMock = vi
      .fn()
      .mockResolvedValue({
        key: 'workshops/pdfs/clave',
        url: 'https://cdn/pdf',
      });
    deleteMock = vi.fn().mockResolvedValue(undefined);
    const adapter = {
      upload: uploadMock,
      uploadPdf: uploadPdfMock,
      delete: deleteMock,
      getUrl: vi.fn().mockReturnValue('https://cdn/clave'),
      getPdfUrl: vi.fn().mockReturnValue('https://cdn/pdf'),
    } as unknown as StorageAdapter;
    service = new StorageService(adapter);
  });

  it('rechaza la petición sin archivo', async () => {
    await expect(
      service.uploadImage(undefined, TEAM_IMAGE_RULE),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('detecta el MIME por el contenido y no por el nombre del archivo', async () => {
    const archivo = imageFile(Buffer.from('<html></html>'));

    await expect(
      service.uploadImage(archivo, TEAM_IMAGE_RULE),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('rechaza imágenes que superan el tamaño permitido', async () => {
    const archivo = imageFile(PNG, TEAM_IMAGE_RULE.maxBytes + 1);

    await expect(
      service.uploadImage(archivo, TEAM_IMAGE_RULE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('devuelve la clave y la URL del adaptador', async () => {
    const resultado = await service.uploadImage(
      imageFile(PNG),
      TEAM_IMAGE_RULE,
    );

    expect(resultado).toEqual({ key: 'clave', url: 'https://cdn/clave' });
    expect(uploadMock).toHaveBeenCalledWith(
      expect.any(Object),
      'image/png',
      TEAM_IMAGE_RULE,
    );
  });

  it('traduce el fallo del proveedor a 502', async () => {
    uploadMock.mockRejectedValue(new Error('Cloudinary caído'));

    await expect(
      service.uploadImage(imageFile(PNG), TEAM_IMAGE_RULE),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('no propaga errores al limpiar una imagen huérfana', async () => {
    deleteMock.mockRejectedValue(new Error('no encontrada'));

    await expect(service.delete('clave')).resolves.toBeUndefined();
    expect(deleteMock).toHaveBeenCalledTimes(3);
  });

  it('reintenta y traduce el fallo persistente al borrar a 502', async () => {
    deleteMock.mockRejectedValue(new Error('Cloudinary caído'));

    await expect(service.deleteRequired('clave')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
    expect(deleteMock).toHaveBeenCalledTimes(3);
  });

  it('reintenta y termina si el proveedor responde', async () => {
    deleteMock
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(undefined);

    await expect(service.deleteRequired('clave')).resolves.toBeUndefined();
    expect(deleteMock).toHaveBeenCalledTimes(2);
  });

  it('rechaza la petición sin PDF', async () => {
    await expect(service.uploadPdf(undefined, PDF_RULE)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rechaza un archivo que no es PDF con 415', async () => {
    await expect(
      service.uploadPdf(pdfFile(Buffer.from('<html></html>')), PDF_RULE),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(uploadPdfMock).not.toHaveBeenCalled();
  });

  it('rechaza un PDF con extensión incorrecta o demasiado grande con 400', async () => {
    await expect(
      service.uploadPdf(pdfFile(PDF, PDF.length, 'programa.docx'), PDF_RULE),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.uploadPdf(pdfFile(PDF, PDF_RULE.maxBytes + 1), PDF_RULE),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(uploadPdfMock).not.toHaveBeenCalled();
  });

  it('devuelve la clave y la URL del PDF del adaptador', async () => {
    const resultado = await service.uploadPdf(pdfFile(PDF), PDF_RULE);

    expect(resultado).toEqual({
      key: 'workshops/pdfs/clave',
      url: 'https://cdn/pdf',
    });
    expect(uploadPdfMock).toHaveBeenCalledWith(
      expect.any(Object),
      'application/pdf',
      PDF_RULE,
    );
  });

  it('traduce el fallo del proveedor al subir PDF a 502', async () => {
    uploadPdfMock.mockRejectedValue(new Error('Cloudinary caído'));

    await expect(
      service.uploadPdf(pdfFile(PDF), PDF_RULE),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('elimina PDFs con el tipo de recurso raw', async () => {
    await service.deleteRequired('workshops/pdfs/clave', 'raw');
    expect(deleteMock).toHaveBeenCalledWith('workshops/pdfs/clave', 'raw');
  });
});
