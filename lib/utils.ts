import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface PreciosCalculados {
  precioLista: number
  precioTransferencia: number
  precioOferta: number | null
  precioOfertaTransferencia: number | null
}

export function calcularPrecios(
  basePrice: number,
  cashDiscountPercent: number,
  isOnSale: boolean,
  salePercent: number
): PreciosCalculados {
  const precioLista = basePrice
  const precioTransferencia = basePrice * (1 - cashDiscountPercent / 100)
  const precioOferta = isOnSale ? basePrice * (1 - salePercent / 100) : null
  const precioOfertaTransferencia =
    isOnSale && precioOferta !== null
      ? precioOferta * (1 - cashDiscountPercent / 100)
      : null

  return { precioLista, precioTransferencia, precioOferta, precioOfertaTransferencia }
}
