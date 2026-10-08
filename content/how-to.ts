// The words on the "How to use AssisTED" page. Edit the text here; the layout is in app/how-to/page.tsx.

export const HOW_TO = {
  title: "Marking with AssisTED",
  subtitle: "Five steps, a few minutes. AssisTED suggests, you decide.",
  intro:
    "AssisTED is a marking assistant. It reads a submission against the assignment's rubric, suggests a mark and some kind wording, and shows you the exact parts of the work it used, so you can check it yourself. You are always the one who decides.",
  steps: [
    {
      title: "Pick the assignment",
      body: "Choose the course, then the assignment. AssisTED loads that assignment's rubric so the right standard is used. For Build, Brand and Balance there are no marks: it tells you Complete or Not complete.",
    },
    {
      title: "Add the work",
      body: 'Drop in one or more files (Word, PDF, spreadsheets or CSV), or paste text. Give each file a short label such as "Budget" or "Evaluation" so everyone knows what is what. Got a link as well? Add it in the optional links box. AssisTED does not open links, so it will remind you to check them yourself.',
    },
    {
      title: "Check the names",
      body: "Before anything is sent, AssisTED hides names, contact details and ID numbers. Add the learner's name so it is hidden too, and look over the suggestions to make sure nothing personal is left.",
    },
    {
      title: "Mark",
      body: "Press the mark button and give it a moment. The sections above fold away while it works.",
    },
    {
      title: "Read the result",
      body: "There are two parts. Notes for you give the reasoning and the quotes it found in the work. Feedback for the learner is warm, plain and ends with next steps. Edit anything you like before you use it.",
    },
  ],
  goodToKnow: [
    { title: "Borderline", body: "The work sits between two marks. Take a closer look yourself before deciding." },
    { title: "Reflections", body: "If the work includes one, the feedback mentions it. A missing reflection never lowers a mark." },
    {
      title: "Complete or Not complete",
      body: "A checklist shows what it found, with quotes. Items it could only find as a link are listed for you to check, and never count against the learner.",
    },
    { title: "What it cannot see", body: "Links, images, videos and handwriting, and anything inside a Gem or Notebook that was not pasted or attached." },
    {
      title: "Privacy",
      body: "Learner names and contact details are removed before the work is sent for marking, and AssisTED is designed not to keep submissions, feedback or marks.",
    },
    { title: "It can be wrong", body: "If something looks off, trust your own judgement and tell the QA team so it can be improved." },
  ],
  faq: [
    { q: "Why did it give this mark?", a: "Open Notes for you. Each point is backed by a quote from the work." },
    { q: "Can I change the feedback?", a: "Yes. Edit it before you copy or use it." },
    {
      q: "A file did not read properly. What now?",
      a: "Check the message on that file. Scanned pages and photos cannot be read, so paste the text or attach a typed version.",
    },
    { q: "Who can see my marking?", a: "Only you, while you are using it. Submissions and results are not saved." },
  ],
  // Headings and labels that are part of the page, not the supplied wording.
  labels: {
    start: "Start marking",
    stepsHeading: "The five steps",
    goodToKnowHeading: "Good to know",
    exampleHeading: "What a result looks like",
    exampleIntro: "Here is an example with made-up details, so you can see how to read one.",
    exampleBadge: "Example, not real marking",
    faqHeading: "Questions people ask",
    bottomHeading: "Ready when you are",
  },
} as const;

// A made-up result for the example card. Every name, quote and mark here is invented.
export const EXAMPLE_RESULT = {
  rawScore: 3,
  mark: 3,
  borderline: false,
  ceilingBand: 4,
  capped: false,
  topicMismatch: false,
  mismatchReason: "",
  presenceEvidence: [
    {
      criterion: "Compares the two versions",
      level: "required" as const,
      quote: "The assistant's version was more polished, but mine felt more personal.",
      met: true,
      from: "Evaluation",
    },
    {
      criterion: "Suggests how to improve the AI version",
      level: "stretch" as const,
      quote: null,
      met: false,
    },
  ],
  feedback: {
    recognition: "Thank you for a thoughtful comparison. You noticed that the polished version felt less personal, which is a useful observation.",
    explanation: "Your evaluation meets the expectations for this assignment: it compares both versions and gives a clear view on each.",
    nextSteps: [
      "Adding one idea for how to improve the AI version would take this further.",
      "A short example of a phrase you would change could make your point even clearer.",
    ],
    motivation: "You are already thinking critically about AI writing, and that will serve you well.",
  },
  markerNotes: {
    rationale:
      "I'd read this as a solid piece that does what the brief asks. It compares both versions and gives a view on each. It doesn't suggest how to improve the AI version, which is why I haven't placed it higher. Worth a quick look at the quote below if you'd like to check.",
    explanationEvidence: { type: "quote" as const, text: "The assistant's version was more polished, but mine felt more personal.", from: "Evaluation" },
    nextStepNotes: [
      { evidence: { type: "absence" as const, text: "An idea for improving the AI version." }, why: "It would show the learner can act on what they noticed." },
      { evidence: { type: "quote" as const, text: "mine felt more personal", from: "Evaluation" }, why: "A concrete example would back up this point." },
    ],
  },
};
