"use client"

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/app/actions/notifications"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

type Prefs = {
  renewalAlertsEnabled: boolean
  renewalAlertDaysBefore: number
  weeklyDigestEnabled: boolean
}

export function NotificationPreferencesCard() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    getNotificationPreferences().then(setPrefs)
  }, [])

  const handleSave = () => {
    if (!prefs) return
    startTransition(async () => {
      try {
        await updateNotificationPreferences(prefs)
        toast.success("Preferences saved")
        router.refresh()
        setDirty(false)
      } catch {
        toast.error("Failed to save preferences")
      }
    })
  }

  return (
    <Card className="premium-card premium-glow">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <CardTitle className="text-base">
              Notification preferences
            </CardTitle>
          </div>
          {dirty && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={isPending}
            >
              Save
            </Button>
          )}
        </div>
        <CardDescription className="leading-relaxed">
          Get email alerts before your subscriptions renew.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {prefs && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Renewal alerts</span>
                <span className="text-xs text-muted-foreground">
                  Receive an email when a subscription is about to renew
                </span>
              </div>
              <Switch
                checked={prefs.renewalAlertsEnabled}
                onCheckedChange={(checked) => {
                  setPrefs({ ...prefs, renewalAlertsEnabled: checked })
                  setDirty(true)
                }}
              />
            </div>
            {prefs.renewalAlertsEnabled && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Alert me</span>
                <Select
                  value={String(prefs.renewalAlertDaysBefore)}
                  onValueChange={(v) => {
                    setPrefs({
                      ...prefs,
                      renewalAlertDaysBefore: Number(v),
                    })
                    setDirty(true)
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">7 days before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Weekly money-leak digest</span>
                <span className="text-xs text-muted-foreground">
                  A weekly email summarizing wasted spend across your subscriptions
                </span>
              </div>
              <Switch
                checked={prefs.weeklyDigestEnabled}
                onCheckedChange={(checked) => {
                  setPrefs({ ...prefs, weeklyDigestEnabled: checked })
                  setDirty(true)
                }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
