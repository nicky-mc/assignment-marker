export interface Course {
  id: string;
  name: string;
}

export const COURSES: Course[] = [
  { id: "ai-literacy", name: "AI Literacy" },
  { id: "digital-marketing-ai", name: "Digital Marketing with AI" },
];

export interface Rubric {
  id: string;
  courseId: string;
  week: string;
  title: string;
  overview: string;
  requirements: string;
  stretchGoal: string;
  /** Per-assignment band descriptions, when they differ meaningfully from the generic policy bands. */
  bandDescriptions?: string[];
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
    courseId: "ai-literacy",
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
    courseId: "ai-literacy",
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
    courseId: "ai-literacy",
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
    courseId: "ai-literacy",
    week: "Week 5",
    title: "Point of View Statement",
    overview:
      "Uses an LLM to help identify business problems, compares them with manually generated problems, prioritises by customer value, and writes Point of View statements for the highest-priority problems.",
    requirements:
      "Submits the prompts used (and what the AI surfaced that the learner had forgotten), the highest priority problems, the Point of View statement(s), and an assessment of the AI output.",
    stretchGoal:
      "Uses the LLM to refine the Point of View statements, tweaking prompts until the learner has a statement they can stand by.",
  },
  {
    id: "dmai-wk1-ceo-audit",
    courseId: "digital-marketing-ai",
    week: "Week 1",
    title: "The CEO Audit",
    overview:
      "A report reviewing the learner's business (or one known to them) to explore how marketing is applied: mission/vision/values, the 7Ps of Marketing, and outbound/inbound and paid/owned/earned media use, with an optional SWOT analysis.",
    requirements:
      "Details the company's Vision, Mission and Values, and applies the 7Ps of Marketing to the business (if there are gaps or nothing in place, the learner should highlight what they'd like to do/suggest doing in future).",
    stretchGoal:
      "Everything for 3 marks, plus examples of the business's use of outbound/inbound marketing tactics, organised into paid/owned/earned media types (hypothetical/future examples are fine if none are currently in use).",
    bandDescriptions: [
      "0 - Not attempted or no submission.",
      "1 - Attempted but does not show understanding: the submission relates to the assignment but ultimately does not align with the criteria, e.g. content does not match any of the four headings (Mission/Vision/Values, 7Ps, outbound/inbound & paid/owned/earned media, SWOT), or shows errors that indicate a lack of understanding across all headings tackled.",
      "2 - Incomplete but shows understanding: missing the Mission/Vision/Values heading entirely, or has not tackled at least two of the other headings; or there are errors in explaining vision vs mission vs values, or errors showing a lack of understanding in more than one heading tackled; or the submission significantly and obviously exceeds any stated space limit.",
      "3 - Complete and meets expectations: the student has detailed their company's Vision, Mission and Values, and applied the 7Ps of Marketing to their business (noting gaps/future suggestions if any Ps are missing).",
      "4 - Complete and exceeds expectations: everything for 3 marks, plus the student has listed examples of their use of outbound/inbound marketing tactics, organised into paid/owned/earned media types (or hypothetical/future examples if they don't currently do any of these).",
    ],
  },
  {
    id: "dmai-wk4-digital-deep-dive",
    courseId: "digital-marketing-ai",
    week: "Week 4",
    title: "Digital Deep Dive",
    overview:
      "A follow-up report requiring a deep dive into at least one of the business's digital marketing channels: objectives, channel strategy, content strategy, media strategy, tactics, and place within the sales funnel. Maximum 3 pages.",
    requirements:
      "A deep dive on at least one channel covering Objectives, Content Strategy, Channel Strategy, Media Strategy, Tactics, and Place within the sales funnel, including a deep dive of at least one of Website, Email, or Social Media (even if no strategy is currently in place there).",
    stretchGoal:
      "Everything for 3 marks, plus one recommendation for an additional, valid channel strategy.",
    bandDescriptions: [
      "0 - Not attempted - no submission. Student has failed to submit any work for this project.",
      "1 - Attempted but does not show understanding: student has submitted some work relating to the project, but it ultimately does not align with the brief.",
      "2 - Incomplete but shows understanding: student has submitted work, but is missing one of the key areas - Objectives, Content Strategy, Media Strategy, Tactics, or Place within the sales funnel.",
      "3 - Complete and meets expectations: student has created a comprehensive deep dive into the digital marketing activities covering Objectives, Content Strategy, Channel Strategy, Media Strategy, Tactics, and Place within the sales funnel, and has done a deep dive of at least one of Website, Email, or Social Media, even if no marketing strategy is currently in place there.",
      "4 - Complete and exceeds expectations: everything for 3 marks, plus the student has made one recommendation to an additional and valid channel strategy.",
    ],
  },
  {
    id: "dmai-wk5-personas",
    courseId: "digital-marketing-ai",
    week: "Week 5",
    title: "Customer Personas",
    overview:
      "Develops detailed, pivotal customer personas to help target and engage the audience, each with a name, location, profession/industry, income/turnover, point of need/challenge, buying behaviour and frequency, communication style, preferred channel(s), and tone of voice.",
    requirements:
      "2-3 customer personas, each including: persona name, location, profession or industry, income or turnover, point of need/challenge, buying behaviour and frequency, communication style, preferred channel(s), and tone of voice.",
    stretchGoal:
      "Everything for 3 marks, but with 3 full personas, plus the number of touchpoints and relevant opportunities within the sales funnel defined for a generalised sale (a working hypothesis is acceptable).",
    bandDescriptions: [
      "0 - Not attempted - no submission. Student has failed to submit any work for this project.",
      "1 - Attempted but does not show understanding: student has submitted some work relating to the project, but it ultimately does not align, or the submission does not show learning (e.g. it looks purely AI-generated with no evaluation or adaptation by the student).",
      "2 - Incomplete but shows understanding: student has submitted work, but is missing at least one of the required persona elements (name, location, profession/industry, income/turnover, point of need/challenge, buying behaviour & frequency, communication style, preferred channel(s), tone of voice).",
      "3 - Complete and meets expectations: student has created 2-3 customer personas that each include persona name, location, profession or industry, income or turnover, point of need/challenge, buying behaviour and frequency, communication style, preferred channel(s), and tone of voice.",
      "4 - Complete and exceeds expectations: everything for 3 marks, plus the student has completed 3 personas and defined the number of touchpoints and relevant opportunities within the sales funnel for a generalised sale (a working hypothesis is fine).",
    ],
  },
  {
    id: "dmai-wk6-email-campaigns",
    courseId: "digital-marketing-ai",
    week: "Week 6",
    title: "Email Campaigns",
    overview:
      "Uses AI to generate an email campaign - either a 3-stage sales-funnel campaign with a defined audience, or a 'Show Me You Know Me' (SMYKM) email with a follow-up - and evaluates the AI output and its usefulness for the business.",
    requirements:
      "Either a 3-stage funnel campaign with a defined audience (clear persona, 3 separate emails forming a full funnel approach, clear call to action in each) or a 'Show Me You Know Me' email with a follow-up email (SMYKM subject line, non-salesy first sentence, clear transition, clear challenge, clear value proposition, clear objection handling, concise close), plus reflections on how well the AI achieved this and how it could help the business.",
    stretchGoal:
      "Submits BOTH the 3-stage funnel campaign AND the 'Show Me You Know Me' email with follow-up, each independently meeting the 3-mark criteria.",
    bandDescriptions: [
      "0 - Not attempted - no submission. Student has failed to submit any work for this project.",
      "1 - Attempted but does not show understanding: student has submitted some work relating to the project, but it ultimately does not align.",
      "2 - Incomplete but shows understanding: e.g. the student has submitted work but has not evaluated the AI's response/reflected on it.",
      "3 - Complete and meets expectations: EITHER a 3-stage funnel campaign with a defined audience that shows a clear persona, a full sales-funnel approach with 3 separate emails, and a clear call to action in each; OR a 'Show Me You Know Me' email to a targeted customer that includes a SMYKM subject line, a non-salesy first sentence, a clear transition, a clear challenge, a clear value proposition, clear objection handling, a concise close, AND a follow-up email.",
      "4 - Complete and exceeds expectations: the student has submitted BOTH a 3-stage funnel campaign with a defined audience meeting the 3-mark criteria AND a 'Show Me You Know Me' email with a follow-up email meeting the 3-mark criteria.",
    ],
  },
  {
    id: "dmai-wk7-content-plan",
    courseId: "digital-marketing-ai",
    week: "Week 7",
    title: "Content Plan",
    overview:
      "Applies different types of marketing content to the learner's marketing and business goals by creating a content plan.",
    requirements:
      "A content plan with a minimum of three pieces of content, using and explaining each of the areas described in the content plan template.",
    stretchGoal:
      "Everything for 3 marks, and the content covers each of the areas/stages of the sales funnel.",
    bandDescriptions: [
      "0 - Not attempted - no submission. Student has failed to submit any work for this project.",
      "1 - Attempted but does not show understanding: student has submitted some work relating to the project, but it ultimately does not align.",
      "2 - Incomplete but shows understanding: student has submitted work, but has not created a finished content plan with a minimum of three pieces of content fully described in the plan outline.",
      "3 - Complete and meets expectations: the student has created a content plan with a minimum of three pieces of content, using and explaining each of the areas described in the content plan template.",
      "4 - Complete and exceeds expectations: everything for 3 marks, and the content plan's pieces of content cover each of the areas of the sales funnel.",
    ],
  },
  {
    id: "dmai-wk9-more-reach",
    courseId: "digital-marketing-ai",
    week: "Week 9",
    title: "More Reach",
    overview:
      "Creates a social media marketing plan of at least 5 posts, each specifying channel, post type, date, caption, image assets & descriptions, and relevant hashtags.",
    requirements:
      "A series of at least 5 social posts, each covering Channel, Post Type, Date, Caption, Image Assets & Descriptions, and Relevant Hashtags.",
    stretchGoal:
      "Everything for 3 marks, and demonstrates how the series of posts links to a content cluster, event, or brand-based persona.",
    bandDescriptions: [
      "0 - Not attempted - no submission. Student has failed to submit any work for this project.",
      "1 - Attempted but does not show understanding: student has submitted some work relating to the project, but it ultimately does not align.",
      "2 - Incomplete but shows understanding: student has submitted work, but has not created a series of social posts focused on a specific piece of content.",
      "3 - Complete and meets expectations: the student has completed a series of at least 5 social posts that each include Channel, Post Type, Date, Caption, Image Assets & Descriptions, and Relevant Hashtags.",
      "4 - Complete and exceeds expectations: everything for 3 marks, and the student demonstrates how the series links to a content cluster, event, or brand-based persona.",
    ],
  },
];

export function getRubric(id: string): Rubric | undefined {
  return RUBRICS.find((r) => r.id === id);
}

export function getRubricsForCourse(courseId: string): Rubric[] {
  return RUBRICS.filter((r) => r.courseId === courseId);
}
