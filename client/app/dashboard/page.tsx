'use client'

import Link from 'next/link'
import { Card } from '../../components/Ui'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <Card
        title="Welcome"
        subtitle="This MVP monitors approvals and sends email alerts. Use the pages below to manage wallets and reduce noise via allowlist."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <QuickLink
            title="Wallets"
            desc="Add wallets and check their scan status."
            href="/dashboard/wallets"
          />
          <QuickLink
            title="Approvals feed"
            desc="See detected approval events with risk level and reasons."
            href="/dashboard/approvals"
          />
          <QuickLink
            title="Allowlist"
            desc="Mark trusted spenders/operators to reduce alerts noise."
            href="/dashboard/allowlist"
          />
        </div>
      </Card>

      <Card title="Email notifications" subtitle="Notifications are sent to your account email (configured during registration).">
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>Emails contain a batch of detected events per scan tick (limited by an env setting).</li>
          <li>Only events with riskScore &gt; 0 are included.</li>
          <li>To reduce alerts, add common spenders to the allowlist.</li>
        </ul>
      </Card>
    </div>
  )
}

function QuickLink({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
      <div className="mt-3 text-sm font-medium text-slate-900">Open →</div>
    </Link>
  )
}
