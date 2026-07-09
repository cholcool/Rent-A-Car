import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma'
import { SessionUser } from '@/types/session';
import { verifyPassword } from '@/rbac/auth-connects'

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        csrfToken: { label: 'CsrfToken', type: 'text' },
        remember: { label: 'Remember', type: 'boolean' },
      },
      async authorize(credentials) {
        const username = typeof credentials?.username === 'string' ? credentials.username : '';
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        const identifier = username || email;
        if (!identifier || !password) return null;

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [{ userName: identifier }, { email: identifier }],
            },
            include: { roles: { include: { role: true } } },
          });
  
          if (!user || !verifyPassword(password, user.hashedPassword)) return null;
  
          return {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`,
            roles: user.roles.map((userRole) => userRole.role.code),
          };
        } catch (error) {
          console.error('Error during authentication:', error);

          throw new Error('An error occurred during authentication. Please try again later.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & SessionUser;
        token.id = authUser.id;
        token.roles = Array.isArray(authUser.roles) ? authUser.roles : [];
        token.phone = authUser.phone;
        token.email = authUser.email;
        token.name = authUser.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & SessionUser;
        sessionUser.id = token.id as string;
        sessionUser.roles = Array.isArray(token.roles) ? token.roles : [];
        sessionUser.phone = token.phone as string;
        sessionUser.email = token.email as string;
        sessionUser.name = token.name as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Export ตัว handlers และ auth ไปใช้ที่อื่น
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
