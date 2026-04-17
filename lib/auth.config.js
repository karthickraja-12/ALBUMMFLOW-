import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Edge-compatible auth config (no Prisma, no bcrypt)
// Used by middleware (proxy.js) which runs on Edge Runtime
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // authorize runs only on Node.js (in the API route), not in Edge
      async authorize() { return null; }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.is_approved = user.is_approved;
        token.company_name = user.company_name;
        token.logo_url = user.image;
        token.brand_color = user.brand_color;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.is_approved = token.is_approved;
        session.user.company_name = token.company_name;
        session.user.logo_url = token.logo_url;
        session.user.brand_color = token.brand_color;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
