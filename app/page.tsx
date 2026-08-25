import { JobStoreProvider } from '@/components/console/job-store'
import { TodayScreen } from '@/components/console/today-screen'

export default function Page() {
  return (
    <JobStoreProvider>
      <TodayScreen />
    </JobStoreProvider>
  )
}
