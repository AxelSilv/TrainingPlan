import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/auth/signin',
  },
})

export const config = {
  matcher: ['/calendar/:path*', '/dashboard/:path*', '/nutrition/:path*', '/settings/:path*'],
}

