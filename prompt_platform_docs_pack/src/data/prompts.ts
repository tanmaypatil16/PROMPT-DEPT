export type PromptSample = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  prompt: string;
  image: string;
  premium?: boolean;
  aspect: "portrait" | "landscape" | "square";
};

export const promptCategories = [
  "All",
  "Image",
  "3D & Motion",
  "Website",
  "Code",
  "Writing",
  "Study & Exams",
  "Product Photo",
  "Architecture",
  "Visual Experiment",
] as const;

const image = (photo: string) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=85`;

export const promptSamples: PromptSample[] = [
  {
    id: "otherworldly-by-design",
    title: "Otherworldly, by Design",
    category: "Image",
    tags: ["concept art", "worldbuilding"],
    description: "Build a visual universe with rules, mood, and material detail.",
    prompt: "Act as a worldbuilding art director. Create a concise visual language for a fictional place, including atmosphere, materials, color relationships, and three scene prompts.",
    image: image("photo-1531058020387-3be344556be6"),
    aspect: "portrait",
  },
  {
    id: "portfolio-that-moves",
    title: "The Portfolio That Moves",
    category: "Website",
    tags: ["portfolio", "web design"],
    description: "Turn a body of work into a memorable digital experience.",
    prompt: "Act as a digital portfolio strategist. Plan a cinematic portfolio homepage with a clear narrative, image treatment, motion moments, and accessible interaction notes.",
    image: image("photo-1558655146-d09347e92766"),
    premium: true,
    aspect: "landscape",
  },
  {
    id: "character-with-universe",
    title: "A Character With a Universe",
    category: "Image",
    tags: ["character", "story"],
    description: "Give a character a point of view, history, and world around them.",
    prompt: "Create a character bible for an original protagonist. Include formative history, contradictions, visual motifs, allies, antagonists, and five story scenes that reveal their world.",
    image: image("photo-1500534314209-a25ddb2bd429"),
    aspect: "square",
  },
  {
    id: "learn-it-remember-it",
    title: "Learn It. Remember It.",
    category: "Study & Exams",
    tags: ["study", "memory"],
    description: "Turn dense notes into recall-ready learning material.",
    prompt: "Turn these notes into a learning kit: a plain-language explanation, progressive flashcards, retrieval questions, and a short spaced-repetition schedule.",
    image: image("photo-1456513080510-7bf3a84b82f8"),
    aspect: "portrait",
  },
  {
    id: "editorial-product-photography",
    title: "Editorial Product Photography",
    category: "Product Photo",
    tags: ["photography", "art direction"],
    description: "Shape a product image with intent before opening the camera.",
    prompt: "Art-direct an editorial product shoot. Specify the visual reference, set construction, lens language, lighting, composition, and post-production treatment.",
    image: image("photo-1523275335684-37898b6baf30"),
    aspect: "landscape",
  },
  {
    id: "cinematic-website-concepts",
    title: "Cinematic Website Concepts",
    category: "Website",
    tags: ["website", "interaction"],
    description: "Define a web experience before the interface becomes generic.",
    prompt: "Concept a cinematic website for a creative studio. Outline the narrative flow, art direction, responsive behavior, interaction principles, and performance constraints.",
    image: image("photo-1550745165-9bc0b252726f"),
    premium: true,
    aspect: "square",
  },
  {
    id: "study-notes-to-flashcards",
    title: "Study Notes to Flashcards",
    category: "Study & Exams",
    tags: ["notes", "flashcards"],
    description: "Convert a topic into a focused revision session.",
    prompt: "Create high-quality flashcards from supplied notes. Keep each card atomic, define unfamiliar terms, and add three exam-style checks.",
    image: image("photo-1497633762265-9d179a990aa6"),
    aspect: "landscape",
  },
  {
    id: "futuristic-interface-design",
    title: "Futuristic Interface Design",
    category: "Visual Experiment",
    tags: ["interface", "product"],
    description: "Find a sharp concept and write the system around it.",
    prompt: "Develop a future-facing interface concept. Define its audience, visual system, hierarchy, microcopy voice, core flows, and accessibility safeguards.",
    image: image("photo-1618005198919-d3d4b5a92ead"),
    aspect: "portrait",
  },
  {
    id: "a-world-in-motion",
    title: "A World in Motion",
    category: "3D & Motion",
    tags: ["3D", "animation"],
    description: "Build a tactile, looping scene with a distinct sense of place.",
    prompt: "Design a short seamless 3D animation. Define the scene, materials, camera movement, lighting, motion timing, and a clear visual hook. Keep the loop technically achievable.",
    image: image("photo-1634017839464-5c339ebe3cb4"),
    aspect: "portrait",
  },
  {
    id: "code-with-a-point-of-view",
    title: "Code With a Point of View",
    category: "Code",
    tags: ["frontend", "creative coding"],
    description: "Turn a visual direction into a small, maintainable interface.",
    prompt: "Act as a senior frontend engineer. Translate this visual direction into a responsive implementation plan with semantic HTML, accessible states, reusable components, and performance considerations.",
    image: image("photo-1518770660439-4636190af475"),
    aspect: "landscape",
  },
  {
    id: "the-first-line",
    title: "Find the First Line",
    category: "Writing",
    tags: ["writing", "storytelling"],
    description: "Find a compelling opening for a story that has not started yet.",
    prompt: "Help me begin a story about [premise]. Offer three distinct opening paragraphs with different narrative voices, then explain the promise each opening makes to the reader.",
    image: image("photo-1455390582262-044cdead277a"),
    aspect: "square",
  },
  {
    id: "architecture-in-between",
    title: "Architecture in Between",
    category: "Architecture",
    tags: ["architecture", "space"],
    description: "Explore how light, circulation, and material shape a place.",
    prompt: "Develop an architectural concept for [site and purpose]. Describe the relationship to its surroundings, spatial sequence, natural light, materials, and one unexpected detail. Note assumptions that need a qualified architect's review.",
    image: image("photo-1600607687939-ce8a6c25118c"),
    aspect: "portrait",
  },
  {
    id: "still-life-from-another-world",
    title: "Still Life From Another World",
    category: "Visual Experiment",
    tags: ["still life", "composition"],
    description: "Create an impossible still life that still feels photographed.",
    prompt: "Create an art direction brief for a surreal still-life photograph. Specify three unexpected objects, their arrangement, surface, light source, lens and framing, and the subtle detail that makes the scene believable.",
    image: image("photo-1490312278390-ab64016e0aa9"),
    aspect: "landscape",
  },
];

export function findPrompt(id: string) {
  return promptSamples.find((prompt) => prompt.id === id);
}
