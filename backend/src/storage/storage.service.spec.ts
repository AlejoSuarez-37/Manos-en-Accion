import {
  BadGatewayException,
  BadRequestException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { TEAM_IMAGE_RULE } from './image-rules.js';
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

describe('StorageService', () => {
  let uploadMock: ReturnType<typeof vi.fn>;
  let deleteMock: ReturnType<typeof vi.fn>;
  let service: StorageService;

  beforeEach(() => {
    uploadMock = vi
      .fn()
      .mockResolvedValue({ key: 'clave', url: 'https://cdn/clave' });
    deleteMock = vi.fn().mockResolvedValue(undefined);
    const adapter = {
      upload: uploadMock,
      delete: deleteMock,
      getUrl: vi.fn().mockReturnValue('https://cdn/clave'),
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

    await expect(service.uploadImage(archivo, TEAM_IMAGE_RULE)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('devuelve la clave y la URL del adaptador', async () => {
    const resultado = await service.uploadImage(imageFile(PNG), TEAM_IMAGE_RULE);

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
});
