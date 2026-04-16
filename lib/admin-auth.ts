import { createHash } from 'crypto'

export function getExpectedToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? ''
  return createHash('sha256').update(password).digest('hex')
}

export function verifyAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookies: Record<string, string> = {}

  cookieHeader.split('; ').forEach((pair) => {
    const idx = pair.indexOf('=')
    if (idx > 0) {
      cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
    }
  })

  const token = cookies['admin_session']
  if (!token) return false
  return token === getExpectedToken()
}

export function unauthorizedResponse() {
  return Response.json({ error: 'No autorizado' }, { status: 401 })
}
