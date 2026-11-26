import {
  buildPublicId,
  detectImageMime,
  sanitizeFileName,
  TEAM_IMAGE_RULE,
} from './image-rules.js';

describe('reglas de imágenes', () => {
  it('reconoce JPEG, PNG y WebP por sus bytes iniciales', () => {
    expect(detectImageMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      'image/jpeg',
    );
    expect(
      detectImageMime(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('image/png');
    expect(
      detectImageMime(Buffer.from('RIFF0000WEBPVP8 ', 'ascii')),
    ).toBe('image/webp');
    expect(detectImageMime(Buffer.from('no es imagen'))).toBeUndefined();
  });

  it('sanitiza el nombre original y genera una clave única dentro de la carpeta', () => {
    const nombre = sanitizeFileName('  Foto @equipo 2026!.PNG  ');
    expect(nombre).toBe('fotoequipo2026png');

    const clave = buildPublicId(TEAM_IMAGE_RULE, 'Foto!.png');
    expect(clave).toMatch(/^team-members\/fotopng-[0-9a-f-]{36}$/);
    expect(buildPublicId(TEAM_IMAGE_RULE, '!!!')).toMatch(
      /^team-members\/[0-9a-f-]{36}$/,
    );
  });

  it('define la regla de equipo en 1:1 y hasta 5 MiB', () => {
    expect(TEAM_IMAGE_RULE.width).toBe(1000);
    expect(TEAM_IMAGE_RULE.height).toBe(1000);
    expect(TEAM_IMAGE_RULE.maxBytes).toBe(5 * 1024 * 1024);
    expect(TEAM_IMAGE_RULE.allowedMimes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
  });
});
