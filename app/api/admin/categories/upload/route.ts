import { getAdminSupabase } from '@/lib/supabase-admin'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'

const BUCKET = 'solari-ind'

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedResponse()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null

    if (!file || !name) {
      return Response.json({ error: 'Faltan datos: file y name son requeridos' }, { status: 400 })
    }

    const db = getAdminSupabase()
    const ext = file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = name.replace(/[/\\]/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    const storagePath = `categories/${filename}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(storagePath)
    return Response.json({ url: urlData.publicUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return Response.json({ error: message }, { status: 500 })
  }
}
