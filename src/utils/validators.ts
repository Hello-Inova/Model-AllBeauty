export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 13
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
}

export const messages = {
  required: (field: string) => `Informe ${field}.`,
  invalidPhone: 'Informe um WhatsApp válido.',
  invalidEmail: 'Informe um e-mail válido.',
  chooseService: 'Escolha um serviço.',
  chooseDate: 'Escolha uma data.',
  chooseTime: 'Escolha um horário.',
  slotTaken: 'Esse horário não está mais disponível.',
  invalidImage: {
    format: 'Formato de imagem não suportado.',
    tooLarge: 'A imagem é muito grande.',
    loadFailed: 'Não foi possível carregar esta imagem.',
    invalidUrl: 'URL da imagem inválida.',
  },
  invalidVideo: {
    format: 'Formato de vídeo não suportado. Use MP4, WebM ou MOV.',
    // Recebe o tamanho do arquivo enviado e o limite atual (em bytes) para
    // deixar claro pro admin o motivo real da rejeição — "muito grande" sozinho
    // não ajuda quem não sabe quantos MB o próprio vídeo tem.
    tooLarge: (fileBytes: number, limitBytes: number) =>
      `O vídeo é muito grande (${(fileBytes / (1024 * 1024)).toFixed(1)}MB). O limite é ${Math.round(limitBytes / (1024 * 1024))}MB.`,
    tooLong: 'O vídeo deve ter no máximo 40 segundos.',
    loadFailed: 'Não foi possível carregar este vídeo.',
    invalidUrl: 'URL do vídeo inválida.',
    limitReached: 'Limite de 3 vídeos atingido. Remova um vídeo para adicionar outro.',
  },
}
