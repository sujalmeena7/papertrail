import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(opts: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: opts.to,
    subject: opts.subject,
    react: opts.react,
  })
}
