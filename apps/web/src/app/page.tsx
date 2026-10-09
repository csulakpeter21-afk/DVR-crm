import { redirect } from 'next/navigation';

/** The rep workspace is the product's front door. */
export default function Home() {
  redirect('/queue');
}
