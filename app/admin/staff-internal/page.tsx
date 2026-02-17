"use client"
import React from 'react'
import { useEffect } from 'react'

const Page = () => {
    useEffect(() => {
        fetch("/api/admin/staff-internal")
            .then(res => res.json())
            .then(data => console.log(data.data))
    }, [])
    return (
        <div>

        </div>
    )
}

export default Page
