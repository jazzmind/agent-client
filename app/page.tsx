import { redirect } from 'next/navigation';

export default function Home() {
  // Landing page should go to agents management (admin dashboard)
  redirect('/agents');
}
