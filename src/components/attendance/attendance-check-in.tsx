'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, LogIn, LogOut, Loader2 } from 'lucide-react'
import { checkIn, checkOut, getTodayAttendance } from '@/lib/actions/attendance-actions'
import { toast } from 'sonner'
import { Attendance, Shift, Employee, Branch, Position } from '@prisma/client'

type AttendanceWithRelations = Attendance & {
  shift: Shift | null
  employee: Employee & {
    branch: Branch
    position: Position
  }
}

interface AttendanceCheckInProps {
  employeeId: string
}

export function AttendanceCheckIn({ employeeId }: AttendanceCheckInProps) {
  const [attendance, setAttendance] = useState<AttendanceWithRelations | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    loadTodayAttendance()
  }, [employeeId])

  async function loadTodayAttendance() {
    const result = await getTodayAttendance(employeeId)
    if (result.success && result.data) {
      setAttendance(result.data as AttendanceWithRelations)
    }
  }

  function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLoading(false)
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentLocation(coords)
          resolve(coords)
        },
        (error) => {
          setLocationLoading(false)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  async function handleCheckIn() {
    setLoading(true)
    try {
      const location = await getCurrentLocation()
      const result = await checkIn(employeeId, location.lat, location.lng)

      if (result.success) {
        toast.success(result.message || 'Check-in successful!')
        await loadTodayAttendance()
      } else {
        toast.error(result.error || 'Check-in failed')
      }
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('Please allow location access to check in')
      } else {
        toast.error('Failed to get your location')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut() {
    if (!attendance) return

    setLoading(true)
    try {
      const location = await getCurrentLocation()
      const result = await checkOut(attendance.id, location.lat, location.lng)

      if (result.success) {
        toast.success(result.message || 'Check-out successful!')
        await loadTodayAttendance()
      } else {
        toast.error(result.error || 'Check-out failed')
      }
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('Please allow location access to check out')
      } else {
        toast.error('Failed to get your location')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="default">Present</Badge>
      case 'LATE':
        return <Badge variant="destructive">Late</Badge>
      case 'ABSENT':
        return <Badge variant="secondary">Absent</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Attendance</CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendance ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <p className="text-lg font-semibold">{formatTime(attendance.checkIn)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <p className="text-lg font-semibold">{formatTime(attendance.checkOut)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(attendance.status)}
              </div>
              {attendance.shift && (
                <div>
                  <p className="text-sm text-muted-foreground">Shift</p>
                  <p className="font-medium">{attendance.shift.name}</p>
                </div>
              )}
            </div>

            {!attendance.checkOut && (
              <Button
                onClick={handleCheckOut}
                disabled={loading || locationLoading}
                className="w-full"
                variant="destructive"
              >
                {loading || locationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {locationLoading ? 'Getting location...' : 'Checking out...'}
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Check Out
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">You haven't checked in today</p>
              {currentLocation && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>Location detected</span>
                </div>
              )}
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={loading || locationLoading}
              className="w-full"
            >
              {loading || locationLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {locationLoading ? 'Getting location...' : 'Checking in...'}
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
