export interface Rubric {
  id: string;
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretchGoal: string;
}

export const BAND_DESCRIPTIONS = [
  "0 - Not attempted or non-functional",
  "1 - Attempted but does not show understanding",
  "2 - Incomplete or not fully developed, but shows understanding",
  "3 - Complete and meets the requirements",
  "4 - Complete and exceeds the requirements (stretch goal achieved)",
];

export const RUBRICS: Rubric[] = [
  {
    id: "wk1-evaluate-llm-output",
    week: "Week 1",
    title: "Evaluate an LLM's Output of Written Content Produced in Your Role",
    overview:
      "The learner writes ~100 words on a real work scenario without AI help, prompts an LLM to produce something on the same subject, then evaluates the two versions (readability, engagement, whether either reads as human- or AI-written).",
    requirements:
      "A short (50-100 word) evaluation comparing the learner's own writing and the LLM's output. Can be as critical or complimentary as they like.",
    stretchGoal:
      "The evaluation also gives concrete next steps to improve the AI output, or examples of how the learner has already improved it.",
  },
  {
    id: "wk2-swot-ai-industry",
    week: "Week 2",
    title: "SWOT Analysis on Use of AI in Your Industry",
    overview:
      "A SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis of legal and ethical issues around AI use in the learner's business/industry.",
    requirements:
      "Uses relevant issues (IP law, privacy law, defamation, product liability, contract law, labour law, AI regulation) in the analysis, and explains what each issue means rather than just listing it.",
    stretchGoal:
      "Refers to all key issue areas (explaining why any are not relevant if omitted), and reflects on how the task develops the learner's understanding of the business or of AI.",
  },
  {
    id: "wk3-risk-appetite",
    week: "Week 3",
    title: "Evaluate the Risk Appetite of Your Own Business",
    overview:
      "Defines the business's risk appetite for AI use, identifies three areas AI could be applied, and for each outlines benefits, risks (legal, ethical, reputational, financial, operational), and alignment with the business's risk appetite.",
    requirements:
      "Defines risk appetite for the business, identifies three AI application areas with benefits/risks/alignment for each, and (if an LLM was used) a ~300 word reflection on how useful or limited the LLM was.",
    stretchGoal:
      "Compares the organisation's risk appetite with a different type of business, discusses how regulation/reputation/culture differences affect AI adoption, and suggests a governance measure that would let the business expand AI use within its risk appetite.",
  },
  {
    id: "wk5-pov-statement",
    week: "Week 5",
    title: "Point of View Statement",
    overview:
      "Uses an LLM to help identify business problems, compares them with manually generated problems, prioritises by customer value, and writes Point of View statements for the highest-priority problems.",
    requirements:
      "Submits the prompts used (and what the AI surfaced that the learner had forgotten), the highest priority problems, the Point of View statement(s), and an assessment of the AI output.",
    stretchGoal:
      "Uses the LLM to refine the Point of View statements, tweaking prompts until the learner has a statement they can stand by.",
  },
];

export function getRubric(id: string): Rubric | undefined {
  return RUBRICS.find((r) => r.id === id);
}
