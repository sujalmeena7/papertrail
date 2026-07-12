"use client"
import { disconnectGmail } from "@/app/actions/receipts"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Mail, CheckCircle2, Loader2, Unplug, ExternalLink } from "lucide-react"
import type { GmailConnection } from "@/lib/db/schema"
import { useTransition } from "react"
import { toast } from "sonner"
import Link from "next/link"

export function GmailCard({ configured, connection }: { configured: boolean, connection: GmailConnection | null }) {
  const [isPending, startTransition] = useTransition()

  const handleDisconnect = () => {
    startTransition(async () => {
      try {
        await disconnectGmail()
        toast.success("Gmail disconnected")
      } catch {
        toast.error("Failed to disconnect")
      }
    })
  }

  return (
    <Card className="premium-card premium-glow transition-all duration-300 ease-in-out">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-base">Gmail</CardTitle>
          </div>
          {connection ? (
             <Badge variant="default" className="bg-green-600 hover:bg-green-700 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.5)] pl-2">
               <span className="relative flex size-2 mr-1.5">
                 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                 <span className="relative inline-flex size-2 rounded-full bg-white"></span>
               </span>
               Connected
             </Badge>
          ) : (
             <Badge variant={configured ? "default" : "secondary"} className="transition-colors">
               {configured ? "Ready to connect" : "Not configured"}
             </Badge>
          )}
        </div>
        <CardDescription className="leading-relaxed">
          {connection 
             ? `Connected as ${connection.email}. Papertrail will automatically scan your inbox for new receipts.`
             : configured
               ? "Google OAuth credentials are set. Connect your Gmail account to start scanning for receipts automatically."
               : "Live Gmail scanning requires Google Cloud OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET with the gmail.readonly scope). Until then, use the demo inbox scan on the dashboard."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connection ? (
          <Button 
            variant="outline" 
            onClick={handleDisconnect} 
            disabled={isPending}
            className="transition-all duration-200"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Disconnecting…
              </>
            ) : (
              <>
                <Unplug className="size-4" aria-hidden="true" />
                Disconnect
              </>
            )}
          </Button>
        ) : configured ? (
          <Link href="/api/gmail/connect" className={buttonVariants()}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Connect Gmail
          </Link>
        ) : null}
        
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Papertrail only ever requests read-only access, processes messages
          transiently for classification, and stores just the extracted receipt
          fields — never your email contents.
        </p>
      </CardContent>
    </Card>
  )
}
