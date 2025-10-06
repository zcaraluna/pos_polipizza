'use client'

import React from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
} from '@mui/material'
import { ErrorOutline, Home } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <ErrorOutline color="error" sx={{ fontSize: 80, mb: 2 }} />
          
          <Typography component="h1" variant="h4" gutterBottom>
            Página No Encontrada
          </Typography>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
            La página que buscas no existe o ha sido movida.
            Verifica la URL o regresa al inicio.
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => router.push('/')}
          >
            Volver al Inicio
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}


