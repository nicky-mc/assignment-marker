import MarkingForm from "@/components/MarkingForm";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 py-16 px-6">
        <div>
          <h1 className="text-3xl font-semibold">Assignment Marker</h1>
          <p className="text-foreground/70">
            Learner submissions, marked against the Tech Educators rubrics.
          </p>
        </div>
        <MarkingForm />
      </main>
    </div>
  );
}

