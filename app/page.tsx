import { redirect } from 'next/navigation';

export default function Home() {
  // Landing page should go to Admin dashboard
  redirect('/admin');
}
