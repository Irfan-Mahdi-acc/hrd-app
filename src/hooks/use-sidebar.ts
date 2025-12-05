'use client'

import { useState, useEffect } from 'react'

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Load state from localStorage
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  const toggle = () => {
    setIsCollapsed((prev) => {
      const newState = !prev
      localStorage.setItem('sidebar-collapsed', String(newState))
      return newState
    })
  }

  return {
    isCollapsed: isMounted ? isCollapsed : false,
    toggle,
    isMounted,
  }
}
