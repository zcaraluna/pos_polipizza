'use client'

import React, { useState } from 'react'
import { Box } from '@mui/material'
import Image from 'next/image'

export default function PolipizzaLogo({ size = 120 }: { size?: number }) {
  const [imageSrc, setImageSrc] = useState('/polipizza.png')
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImageSrc('/api/logo')
    }
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        border: '2px solid #e0e0e0',
        borderRadius: '50%',
        backgroundColor: '#fafafa',
        overflow: 'hidden'
      }}
    >
      <Image
        src={imageSrc}
        alt="Polipizza"
        fill
        unoptimized
        style={{
          objectFit: 'contain'
        }}
        onError={handleError}
      />
    </Box>
  )
}
