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
      note: "Staff will review the evidence and agree or not as appropriate.",
    },
  ],
  goodToKnow: [
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
    anonymiseHeading: "Check what is hidden before you mark",
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
  mark: 3,
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

// The "Check what is hidden before you mark" section. The learner text below is invented. The "what AssisTED sends"
// block is produced by the real anonymiser when the page renders, so it cannot drift from what the code does.
// scripts/check-how-to-example.ts fails if the code starts hiding something listed in `missed`, so this text gets updated.
export const ANONYMISING = {
  intro:
    "AssisTED hides the details it can recognise before anything is sent for marking. It cannot recognise everything, so a person always reviews the text first.",
  beforeLabel: "What the learner wrote",
  afterLabel: "What AssisTED sends",
  before: [
    "Hi, I'm Jo Example.",
    "I run Sunny Side Bakery in Westbury and share photos on Instagram as @sunnysidebakes.",
    "My shop is at 14 Mill Lane, BA13 4AA. You can email me at jo@sunnysidebakery.co.uk or ring 07700 900123.",
    "My neighbour Priya Shah helps on Saturdays, and our menu is at www.sunnysidebakes.shop.",
  ].join("\n"),
  // Text the code leaves visible in the example, each with a label shown beside it in the "sends" block.
  missed: [
    { text: "Sunny Side Bakery", label: "business name" },
    { text: "Westbury", label: "town" },
    { text: "Priya Shah", label: "someone else's name" },
    { text: "www.sunnysidebakes.shop", label: "website" },
  ],
  caughtHeading: "What AssisTED hides for you",
  caught: [
    { what: "Names after patterns such as \"Hi, I'm\" or \"My name is\", sign-offs, and lines like \"Name:\". Also any name you add to Names to remove, wherever it appears", placeholder: "[NAME]" },
    { what: "Email addresses", placeholder: "[EMAIL]" },
    { what: "Phone numbers", placeholder: "[PHONE]" },
    { what: "Web addresses, common website names and @handles", placeholder: "[LINK]" },
    { what: "Street addresses and postcodes", placeholder: "[ADDRESS] [POSTCODE]" },
    { what: "ID numbers, such as National Insurance numbers, sort codes and long account numbers", placeholder: "[ID]" },
    { what: "Business words you choose to redact in the suggestions list", placeholder: "[BUSINESS]" },
  ],
  missedHeading: "What AssisTED can miss",
  missedList: [
    "Business names that were not added to the form",
    "Towns, cities and other places",
    "Names of other people, such as a neighbour, client or colleague",
    "Websites with an unusual ending, such as .shop",
    "A social media handle written without the @",
  ],
  stepsHeading: "How to redact what was missed",
  steps: [
    "Press Anonymise, then read the text in Check the preview. The Highlighted view shows what was replaced.",
    "Look for anything identifying that is still visible.",
    "Switch to Edit and replace it with a neutral label such as [business name], [town] or [handle]. Replace only the identifying words, not whole sentences, so the work can still be judged.",
    "If you are unsure, redact it. A label costs nothing, a leaked name cannot be taken back.",
    "Tick the box to confirm you have checked the preview. If you edit the text again, tick it again.",
  ],
  whyHeading: "Why we review it",
  why: [
    "Automatic hiding only finds patterns it has been taught. Names of businesses, places and people that were not typed into the form look like ordinary words to it.",
    "Learners' work is personal data, and submissions often mention third parties who never agreed to be included.",
    "The human review is the check that keeps AssisTED in line with our data protection responsibilities, and it is quick once it becomes habit.",
  ],
} as const;
