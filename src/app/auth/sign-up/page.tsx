import { SignUp } from "@/components/auth/sign-up";
import { Waitlist } from "@/components/auth/waitlist";

interface SignUpPageProps {
  searchParams: Promise<{ __clerk_ticket: string }>;
}

const SignUpPage = async ({ searchParams }: SignUpPageProps) => {
  const { __clerk_ticket } = await searchParams;

  if (__clerk_ticket) return <SignUp />;

  return <Waitlist />;
};

export default SignUpPage;
