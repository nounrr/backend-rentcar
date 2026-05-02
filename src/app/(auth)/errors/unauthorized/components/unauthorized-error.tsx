"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function UnauthorizedError() {
  const router = useRouter()

  return (
    <div className='mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 md:gap-12 md:p-16'>
      <Image
        src='https://ui.shadcn.com/placeholder.svg'
        alt='Illustration'
        width={960}
        height={540}
        className='aspect-video w-240 rounded-xl object-cover dark:brightness-[0.95] dark:invert'
      />
      <div className='text-center'>
        <h1 className='mb-4 text-3xl font-bold'>401</h1>
        <h2 className="mb-3 text-2xl font-semibold">Non autorise</h2>
        <p>Vous n&apos;avez pas l'autorisation d'acceder a cette ressource. Veuillez vous connecter ou contacter votre administrateur.</p>
        <div className='mt-6 flex items-center justify-center gap-4 md:mt-8'>
          <Button className='cursor-pointer' onClick={() => router.push('/dashboard')}>Retour a l'accueil</Button>
          <Button variant='outline' className='flex cursor-pointer items-center gap-1' onClick={() => router.push('#')}>
            Nous contacter
          </Button>
        </div>
      </div>
    </div>
  )
}
