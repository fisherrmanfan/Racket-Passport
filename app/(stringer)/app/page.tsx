import type { Metadata } from 'next'
import { JobStoreProvider } from '@/components/console/job-store'
import { TodayScreen } from '@/components/console/today-screen'

export const metadata: Metadata = {
  title: 'Today',
}

export default function Page() {
  return (
    <JobStoreProvider>
      <TodayScreen />
    </JobStoreProvider>
  )
}
