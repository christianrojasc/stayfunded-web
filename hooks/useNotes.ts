'use client'
import { useState, useEffect, useCallback } from 'react'
import { DailyNote } from '@/lib/types'
import * as dl from '@/lib/data-layer'
import { v4 as uuidv4 } from 'uuid'

export function useNotes() {
  const [notes, setNotes] = useState<DailyNote[]>([])

  const loadNotes = useCallback(async () => {
    const data = await dl.getNotes()
    setNotes(data)
  }, [])

  useEffect(() => { loadNotes() }, [loadNotes])

  const refresh = useCallback(() => { loadNotes() }, [loadNotes])

  const addNote = useCallback(async (data: Omit<DailyNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const note: DailyNote = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await dl.saveNote(note)
    await loadNotes()
    return note
  }, [loadNotes])

  const updateNote = useCallback(async (id: string, data: Partial<DailyNote>) => {
    const existing = notes.find(n => n.id === id)
    if (!existing) return
    await dl.saveNote({ ...existing, ...data, updatedAt: new Date().toISOString() })
    await loadNotes()
  }, [notes, loadNotes])

  const removeNote = useCallback(async (id: string) => {
    await dl.deleteNote(id)
    await loadNotes()
  }, [loadNotes])

  return { notes, addNote, updateNote, removeNote, refresh }
}
