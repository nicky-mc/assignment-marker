import Image from "next/image";
import MarkingForm from "@/components/MarkingForm";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-6 pt-6 pb-16 px-6">
        <div className="rounded-lg p-6 bg-brand-primary text-brand-secondary">
          <div className="flex items-center gap-3">
            <Image src="/te-monogram.png" alt="" width={30} height={46} className="h-9 w-auto" />
            <h1 className="text-3xl font-semibold">Marking Assistant</h1>
          </div>
          <p className="text-brand-secondary/85">
            Assistant to help grade learner submissions against Tech Educators Rubrics
          </p>
        </div>
        <MarkingForm />
      </main>
    </div>
  );
}

