import { LectureNote } from "./types";

export const INITIAL_LECTURE_NOTES: LectureNote[] = [
  {
    id: "biology-nephron-tissues",
    title: "Tissues and Organ Systems",
    category: "Biology",
    date: "May 03, 2026",
    course: "Anatomy & Physiology",
    tag: "IMAT Focus",
    introduction: "Multicellular organisms solve exchange, transport, coordination, and waste removal by organising specialized cells into four main tissue types.",
    summarySections: [
      {
        title: "Epithelial Tissue",
        description: "Covers surfaces, lines cavities, forms glands.",
        bullets: [
          "Simple squamous: diffusion (alveoli)",
          "Stratified squamous: protection"
        ]
      },
      {
        title: "Connective Tissue",
        description: "Supports, binds, stores, and transports.",
        bullets: [
          "Blood: transport",
          "Bone & Cartilage: support"
        ]
      },
      {
        title: "Muscle Tissue",
        description: "Contracts to produce movement.",
        bullets: [
          "Skeletal: voluntary",
          "Cardiac: involuntary, striated"
        ]
      },
      {
        title: "Extracellular Matrix",
        description: "Structural support, signalling.",
        bullets: [
          "Collagen: tensile strength",
          "Elastin: stretch and recoil"
        ]
      }
    ],
    video: {
      title: "CrashCourse: Human Anatomy & Physiology",
      recommendBy: "Recommended by AI Assistant",
      description: "A comprehensive overview of organ systems and how they maintain homeostasis.",
      url: "https://www.youtube.com/watch?v=uBGl2BujkPQ"
    },
    diagram: {
      title: "Nephron Structure",
      nodes: [
        {
          id: "bowmans-capsule",
          name: "BOWMAN'S CAPSULE",
          description: "Performs glomerular filtration of blood.",
          type: "primary",
          iconName: "drop",
          x: 20,
          y: 35,
          tooltipText: "Filtration"
        },
        {
          id: "loop-of-henle",
          name: "LOOP OF HENLE",
          description: "Generates high osmotic pressure in the medulla.",
          type: "accent",
          iconName: "waves",
          x: 50,
          y: 55,
          tooltipText: "Concentration Gradient"
        },
        {
          id: "collecting-duct",
          name: "COLLECTING DUCT",
          description: "Reabsorbs water under the influence of ADH.",
          type: "warning",
          iconName: "grid",
          x: 80,
          y: 40,
          tooltipText: "Final Water Reabsorption (ADH)"
        }
      ],
      connections: [
        { fromId: "bowmans-capsule", toId: "loop-of-henle", label: "Filtrate flow", colorClass: "border-blue-500" },
        { fromId: "loop-of-henle", toId: "collecting-duct", label: "Urine concentration", colorClass: "border-orange-500" }
      ]
    },
    transcript: "Let's look at the Cardiovascular System. The right side of the heart handles deoxygenated blood, flowing from the vena cava through the Tricuspid Valve to the lungs. Remember 'TRI before you BI'. The oxygenated blood returns to the left atrium, passes the bicuspid valve, and is pumped out through the aorta.\n\nIn the Respiratory System, gas exchange occurs at the alveoli. The critical concept here is the Hb-O2 Dissociation Curve. During exercise, high CO2 and low pH cause a Right Shift (Bohr Effect). This means hemoglobin releases more oxygen exactly where active tissues need it most.",
    terms: [
      {
        term: "Cardiovascular System",
        definition: "Transports O2/CO2, nutrients, waste via heart and vessels."
      },
      {
        term: "Tricuspid Valve",
        definition: "Valve between right atrium and right ventricle."
      },
      {
        term: "Hb-O2 Dissociation Curve",
        definition: "Graph showing hemoglobin saturation with oxygen at different partial pressures."
      },
      {
        term: "Right Shift (Bohr Effect)",
        definition: "Decreased affinity of Hb for O2, releasing more O2 to active tissues."
      }
    ]
  },
  {
    id: "chemistry-acid-base",
    title: "Le Chatelier's Principle & Buffer Systems",
    category: "Chemistry",
    date: "May 18, 2026",
    course: "General Chemistry",
    tag: "Equilibrium",
    introduction: "Chemical systems at equilibrium respond to perturbations by shifting to counteract the imposed change, essential for blood pH regulation.",
    summarySections: [
      {
        title: "Concentration Changes",
        description: "Adding or removing reactants or products shifts equilibrium.",
        bullets: [
          "Add reactant: shifts right to form more products",
          "Remove reactant: shifts left to regenerate reactant"
        ]
      },
      {
        title: "Bicarbonate Buffer",
        description: "Keeps human blood pH precisely between 7.35 and 7.45.",
        bullets: [
          "H2O + CO2 ⇌ H2CO3 ⇌ HCO3- + H+",
          "Hyperventilation expels CO2, raising pH (alkalosis)"
        ]
      }
    ],
    video: {
      title: "Bozeman Science: Acid-Base Equilibrium",
      recommendBy: "AI Highlight",
      description: "How buffers resist changes in pH when acids or bases are added.",
      url: "https://www.youtube.com/watch?v=g_tMQ06N-Xg"
    },
    diagram: {
      title: "Bicarbonate Buffer Equilibrium",
      nodes: [
        {
          id: "carbon-dioxide",
          name: "DISSOLVED CO2",
          description: "Gaseous waste from cellular respiration.",
          type: "primary",
          iconName: "activity",
          x: 20,
          y: 40,
          tooltipText: "Respiratory component"
        },
        {
          id: "carbonic-acid",
          name: "CARBONIC ACID",
          description: "Intermediate weak acid formed by carbonic anhydrase.",
          type: "secondary",
          iconName: "drop",
          x: 50,
          y: 40,
          tooltipText: "Unstable intermediate"
        },
        {
          id: "bicarbonate-ions",
          name: "BICARBONATE & H+",
          description: "Active buffer base and free hydrogen ions.",
          type: "warning",
          iconName: "waves",
          x: 80,
          y: 40,
          tooltipText: "Renal regulation system"
        }
      ],
      connections: [
        { fromId: "carbon-dioxide", toId: "carbonic-acid", label: "Hydration reaction" },
        { fromId: "carbonic-acid", toId: "bicarbonate-ions", label: "Dissociation" }
      ]
    },
    transcript: "To understand blood homeostasis, we must study the Carbonic Acid buffer system. When you exercise, cells produce carbon dioxide. Carbon dioxide hydrates into carbonic acid, which dissociates into bicarbonate and protons. If your blood becomes too acidic, bicarbonate absorbs excess protons. If you hyperventilate, you blow off too much carbon dioxide, causing respiratory alkalosis. This is easily explained by Le Chatelier's Principle: the loss of reactant CO2 shifts the entire equilibrium leftward, consuming protons and raising pH.",
    terms: [
      {
        term: "Carbonic Acid",
        definition: "A weak diprotic acid (H2CO3) that acts as an intermediate in blood buffering."
      },
      {
        term: "Le Chatelier's Principle",
        definition: "If a constraint is applied to a system in equilibrium, the equilibrium will shift to counteract the effect of the constraint."
      },
      {
        term: "Respiratory Alkalosis",
        definition: "A state of elevated blood pH caused by hyperventilation and subsequent loss of CO2."
      }
    ]
  },
  {
    id: "physics-electromagnetism",
    title: "Faraday's Law & Electromagnetic Induction",
    category: "Physics",
    date: "April 29, 2026",
    course: "Electromagnetism",
    tag: "AP Physics",
    introduction: "A changing magnetic flux through a loop of wire induces an electromotive force (EMF) and current, forming the basis for power generators.",
    summarySections: [
      {
        title: "Magnetic Flux",
        description: "Measure of the total magnetic field passing through an area.",
        bullets: [
          "Flux (Φ) = B * A * cos(θ)",
          "Changing flux creates voltage"
        ]
      },
      {
        title: "Lenz's Law",
        description: "The direction of the induced current opposes the change in flux.",
        bullets: [
          "Opposes the increase of incoming field",
          "Conserves energy (prevents runaway currents)"
        ]
      }
    ],
    video: {
      title: "Khan Academy: Faraday's Law Demo",
      recommendBy: "Top Student Pick",
      description: "Visual animations of bar magnets moving through wire coils.",
      url: "https://www.youtube.com/watch?v=txmKr69jGBk"
    },
    diagram: {
      title: "Electromagnetic Coil Loop",
      nodes: [
        {
          id: "moving-magnet",
          name: "BAR MAGNET",
          description: "Source of dynamic magnetic lines of force.",
          type: "primary",
          iconName: "activity",
          x: 20,
          y: 40,
          tooltipText: "Changing magnetic field"
        },
        {
          id: "coil-loop",
          name: "CONDUCTIVE COIL",
          description: "Closed loop of wire experiencing flux changes.",
          type: "secondary",
          iconName: "waves",
          x: 50,
          y: 40,
          tooltipText: "Senses flux change"
        },
        {
          id: "induced-current",
          name: "INDUCED EMF",
          description: "Voltage and electric current driven in the coil.",
          type: "warning",
          iconName: "arrowUp",
          x: 80,
          y: 40,
          tooltipText: "Lenz's Law active feedback"
        }
      ],
      connections: [
        { fromId: "moving-magnet", toId: "coil-loop", label: "Flux change" },
        { fromId: "coil-loop", toId: "induced-current", label: "Generates EMF" }
      ]
    },
    transcript: "Today, core electromagnetic principles are demonstrated by Faraday's Law. If you hold a bar magnet still near a coil of wire, nothing happens. But when you move the magnet closer, the Magnetic Flux through the loops increases. This change induces an electromotive force, driving current. According to Lenz's Law, the induced current creates its own magnetic field that opposes the magnet's motion. This is nature's way of conserving energy. If it helped the magnet, we would create infinite electricity!",
    terms: [
      {
        term: "Magnetic Flux",
        definition: "The product of the average magnetic field times the perpendicular area that it penetrates."
      },
      {
        term: "Faraday's Law",
        definition: "The induced electromotive force in any closed circuit is equal to the negative of the time rate of change of the magnetic flux through the circuit."
      },
      {
        term: "Lenz's Law",
        definition: "The direction of an induced current is always such that it will oppose the change that produced it."
      }
    ]
  }
];
