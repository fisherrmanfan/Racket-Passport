'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  customers as seedCustomers,
  jobs as seedJobs,
  racketModels as seedModels,
  rackets as seedRackets,
} from '@/lib/mock-data'
import { toRacketModel, type CatalogRacket } from '@/lib/catalog'
import { mintShortCode } from '@/lib/short-code'
import type { Customer, Job, RacketInstance, RacketModel, Unit } from '@/lib/types'

/**
 * In-memory store for the prototype. Mirrors the shape a server action layer
 * would expose, so wiring the job tables later is a swap of these calls.
 *
 * Rackets and models live here rather than in the fixtures module because a
 * racket picked out of the catalogue is created at runtime — the console has
 * to be able to grow past its seed data.
 */
interface JobStore {
  jobs: Job[]
  customers: Customer[]
  rackets: RacketInstance[]
  unit: Unit
  setUnit: (unit: Unit) => void
  createJob: (job: Omit<Job, 'id' | 'status'>) => Job
  markReady: (id: string) => void
  markCollected: (id: string) => void
  /** Adds a catalogue frame to a customer's bag and mints its short code. */
  addRacket: (catalog: CatalogRacket, customerId: string, nickname?: string) => RacketInstance
  addCustomer: (name: string, phone: string) => Customer
  /* Lookups — these replace the fixtures module's module-level getters. */
  customerById: (id: string) => Customer
  racketById: (id: string) => RacketInstance
  modelById: (id: string) => RacketModel
  modelForRacket: (racketId: string) => RacketModel
  racketsForCustomer: (customerId: string) => RacketInstance[]
  lastJobForRacket: (racketId: string) => Job | undefined
  /** Toast-style confirmation for the last action. */
  flash?: string
  clearFlash: () => void
}

const Ctx = createContext<JobStore | null>(null)

export function JobStoreProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(seedJobs)
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers)
  const [rackets, setRackets] = useState<RacketInstance[]>(seedRackets)
  const [models, setModels] = useState<RacketModel[]>(seedModels)
  const [unit, setUnit] = useState<Unit>('lb')
  const [flash, setFlash] = useState<string | undefined>()

  const createJob = useCallback((input: Omit<Job, 'id' | 'status'>) => {
    const job: Job = { ...input, id: `j-${Date.now()}`, status: 'queue' }
    setJobs((prev) => [job, ...prev])
    setFlash('Job added to the queue')
    return job
  }, [])

  const markReady = useCallback((id: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? {
              ...j,
              status: 'ready',
              strungAt: new Date().toISOString(),
              dueAt: new Date(Date.now() + 42 * 86_400_000).toISOString(),
            }
          : j,
      ),
    )
    setFlash('Marked ready — customer notified')
  }, [])

  const markCollected = useCallback((id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'collected' } : j)),
    )
    setFlash('Collected')
  }, [])

  const addRacket = useCallback(
    (catalog: CatalogRacket, customerId: string, nickname?: string) => {
      const model = toRacketModel(catalog)
      // The same frame gets picked for a dozen customers; the model is shared,
      // the instance is not (BACKEND doc §2.2).
      setModels((prev) => (prev.some((m) => m.id === model.id) ? prev : [...prev, model]))

      const racket: RacketInstance = {
        id: `r-${Date.now()}`,
        shortCode: mintShortCode(rackets.map((r) => r.shortCode)),
        customerId,
        modelId: model.id,
        nickname,
      }
      setRackets((prev) => [...prev, racket])
      setFlash(`${model.brand} ${model.model} added`)
      return racket
    },
    [rackets],
  )

  const addCustomer = useCallback((name: string, phone: string) => {
    const customer: Customer = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      hoursPerWeek: 4,
    }
    setCustomers((prev) => [...prev, customer])
    return customer
  }, [])

  const value = useMemo<JobStore>(() => {
    const customerById = (id: string) => {
      const found = customers.find((c) => c.id === id)
      if (!found) throw new Error(`Unknown customer ${id}`)
      return found
    }
    const racketById = (id: string) => {
      const found = rackets.find((r) => r.id === id)
      if (!found) throw new Error(`Unknown racket ${id}`)
      return found
    }
    const modelById = (id: string) => {
      const found = models.find((m) => m.id === id)
      if (!found) throw new Error(`Unknown racket model ${id}`)
      return found
    }

    return {
      jobs,
      customers,
      rackets,
      unit,
      setUnit,
      createJob,
      markReady,
      markCollected,
      addRacket,
      addCustomer,
      customerById,
      racketById,
      modelById,
      modelForRacket: (racketId: string) => modelById(racketById(racketId).modelId),
      racketsForCustomer: (customerId: string) =>
        rackets.filter((r) => r.customerId === customerId),
      lastJobForRacket: (racketId: string) =>
        jobs
          .filter((j) => j.racketId === racketId && j.strungAt)
          .sort(
            (a, b) =>
              new Date(b.strungAt as string).getTime() -
              new Date(a.strungAt as string).getTime(),
          )[0],
      flash,
      clearFlash: () => setFlash(undefined),
    }
  }, [
    jobs,
    customers,
    rackets,
    models,
    unit,
    createJob,
    markReady,
    markCollected,
    addRacket,
    addCustomer,
    flash,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useJobStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJobStore must be used inside JobStoreProvider')
  return ctx
}
