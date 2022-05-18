import { Link } from "@remix-run/react";

export default function Index() {
  return (
    <div className="flex flex-col gap-20 items-center mx-auto my-0 h-full justify-center">
      <div className="flex flex-col gap-10">
        <h1 className="text-center font-bold text-6xl">ONLYRams</h1>
        <h2 className="text-center font-semibold text-4xl">How much memory do you have?</h2>
      </div>
      <Link to="rams" className="w-40 text-center bg-pink-500 hover:bg-pink-600 px-4 py-2 text-white rounded-lg">Let's find out</Link>
    </div>
  );
}
