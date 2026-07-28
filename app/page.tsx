import MarkingForm from "@/components/MarkingForm";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 py-16 px-6">
        <div>
          <h1 className="text-2xl font-semibold">Assignment Marker</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            AI Literacy assignments, marked against the Tech Educators rubric.
          </p>
        </div>
        <MarkingForm />
      </main>
    </div>
  );
}

