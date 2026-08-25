import type { Metadata } from 'next'
import { MyRackets } from '@/components/player/my-rackets'

export const metadata: Metadata = {
  title: 'My rackets',
}

export default function Page() {
  return <MyRackets />
}
