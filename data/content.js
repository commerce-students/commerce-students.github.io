window.CS_CONTENT = (function () {
  var classes = {
    11: {
      accountancy: {
        name: "Accountancy",
        description: "Foundations of accounting records and financial statements.",
        chapters: [
          {
            id: "acc11-journal",
            title: "Journal",
            topics: [
              { id: "journal-rules", title: "Rules of Debit and Credit", lesson: "Assets and expenses are debited; liabilities, capital, and income are credited.", keyPoints: ["Personal, real and nominal account logic", "Record both debit and credit for each transaction"], revision: ["Identify account type first", "Apply rule, then amount"] },
              { id: "journal-entries", title: "Journal Entries", lesson: "Record transactions in chronological order with narration.", keyPoints: ["Date, particulars, LF, debit, credit", "Narration should be concise"], revision: ["Check equality of debit and credit", "Use proper account names"] }
            ]
          },
          {
            id: "acc11-ledger",
            title: "Ledger",
            topics: [
              { id: "ledger-posting", title: "Posting", lesson: "Transfer journal entries into ledger accounts for classification.", keyPoints: ["Post debit side and credit side correctly", "Balance c/d and b/d"], revision: ["Use cross reference", "Check totals"] }
            ]
          }
        ]
      },
      business: {
        name: "Business Studies",
        description: "Nature and forms of business organisations.",
        chapters: [
          { id: "bus11-business", title: "Nature and Purpose of Business", topics: [{ id: "business-concepts", title: "Business Concepts", lesson: "Business is an economic activity aimed at regular production and exchange for profit.", keyPoints: ["Economic activity", "Risk", "Profit motive"], revision: ["Contrast with profession and employment"] }] }
        ]
      },
      economics: {
        name: "Economics",
        description: "Microeconomic basics and statistics.",
        chapters: [
          { id: "eco11-demand", title: "Demand", topics: [{ id: "demand-law", title: "Law of Demand", lesson: "Price and quantity demanded move inversely, ceteris paribus.", keyPoints: ["Income effect", "Substitution effect"], revision: ["State assumptions clearly"] }] }
        ]
      }
    },
    12: {
      accountancy: {
        name: "Accountancy",
        description: "Partnership, company accounts and analysis.",
        chapters: [
          {
            id: "acc12-partnership",
            title: "Partnership",
            topics: [
              { id: "goodwill", title: "Goodwill", lesson: "Goodwill is the value of a firm's reputation that enables excess earning capacity.", keyPoints: ["Average profit method", "Super profit method", "Capitalization method"], revision: ["State formula before substitution"] },
              { id: "admission", title: "Admission of Partner", lesson: "Admission changes profit-sharing ratio and may require goodwill and revaluation adjustments.", keyPoints: ["Sacrificing ratio", "Revaluation account"], revision: ["Update capital accounts carefully"] }
            ]
          },
          {
            id: "acc12-cashflow",
            title: "Cash Flow Statement",
            topics: [{ id: "operating-activities", title: "Operating Activities", lesson: "Convert accrual net profit into cash from operations by adjusting non-cash and working capital items.", keyPoints: ["Add depreciation", "Adjust current assets and liabilities"], revision: ["Direction of adjustment matters"] }]
          }
        ]
      },
      business: {
        name: "Business Studies",
        description: "Management principles, marketing, finance, and staffing.",
        chapters: [
          { id: "bus12-staffing", title: "Staffing", topics: [{ id: "recruitment", title: "Recruitment", lesson: "Recruitment searches for prospective employees; selection chooses the best candidate.", keyPoints: ["Internal and external sources", "Merit and transparency"], revision: ["Differentiate recruitment vs selection"] }] },
          { id: "bus12-marketing", title: "Marketing", topics: [{ id: "marketing-mix", title: "Marketing Mix", lesson: "The 4Ps are Product, Price, Place and Promotion.", keyPoints: ["Customer value focus", "Coordination among Ps"], revision: ["Use examples in answers"] }] }
        ]
      },
      economics: {
        name: "Economics",
        description: "Macroeconomics and Indian economic development.",
        chapters: [
          { id: "eco12-income", title: "National Income", topics: [{ id: "gdp-nnp", title: "GDP and NNP", lesson: "National income accounting measures aggregate production and income.", keyPoints: ["GDP at MP and FC", "Depreciation and NNP"], revision: ["Avoid double counting"] }] },
          { id: "eco12-elasticity", title: "Elasticity of Demand", topics: [{ id: "price-elasticity", title: "Price Elasticity", lesson: "Elasticity measures responsiveness of demand to change in price.", keyPoints: ["Percentage method", "Total expenditure method"], revision: ["Mention sign convention"] }] }
        ]
      }
    }
  };

  var formulas = [
    { id: "f1", subject: "Accountancy", chapter: "Partnership", topic: "Goodwill", name: "Goodwill (Super Profit)", formula: "Goodwill = Super Profit × Number of Years' Purchase", variables: "Super Profit = Actual Profit − Normal Profit", example: "If super profit is 40,000 and purchase is 3 years, goodwill = 1,20,000.", commonMistake: "Using average profit directly without subtracting normal profit." },
    { id: "f2", subject: "Economics", chapter: "Elasticity of Demand", topic: "Price Elasticity", name: "Elasticity (Percentage Method)", formula: "Ed = % Change in Quantity Demanded / % Change in Price", variables: "Ed often reported as absolute value", example: "Q rises 20% when P falls 10%, Ed = 2.", commonMistake: "Ignoring negative sign and interpretation." },
    { id: "f3", subject: "Accountancy", chapter: "Cash Flow Statement", topic: "Operating Activities", name: "Cash from Operations", formula: "Net Profit + Non-cash Expenses ± Working Capital Changes", variables: "Add decrease in current assets; subtract increase.", example: "NP 2,00,000 + Dep 20,000 − Increase Debtors 10,000 = 2,10,000.", commonMistake: "Reversing the adjustment direction." }
  ];

  var definitions = [
    { term: "Goodwill", definition: "An intangible asset representing reputation and earning capacity above normal returns.", related: ["Super Profit", "Capitalization"] },
    { term: "Recruitment", definition: "Process of searching potential candidates and encouraging them to apply for jobs.", related: ["Selection", "Staffing"] },
    { term: "National Income", definition: "Monetary value of final goods and services produced by normal residents in an accounting year.", related: ["GDP", "NNP"] }
  ];

  var questions = [
    { id: "acc12-goodwill-001", class: 12, subject: "Accountancy", chapter: "Partnership", topic: "Goodwill", difficulty: "easy", type: "mcq", question: "Goodwill calculated as average profit × years' purchase is called:", options: ["Super profit method", "Average profit method", "Capitalization method", "Hidden goodwill"], correctAnswer: 1, explanation: "Average profit method multiplies maintainable average profit by years' purchase.", tags: ["goodwill"], marks: 1, estimatedTime: 45, sourceType: "original" },
    { id: "acc12-goodwill-002", class: 12, subject: "Accountancy", chapter: "Partnership", topic: "Goodwill", difficulty: "medium", type: "numerical", question: "A firm has average profit ₹80,000 and normal profit ₹50,000. Calculate goodwill at 4 years' purchase.", options: [], correctAnswer: "120000", explanation: "Super profit = 80,000 − 50,000 = 30,000; goodwill = 30,000 × 4 = 1,20,000.", solutionSteps: ["Find super profit", "Multiply by years' purchase"], finalAnswer: "₹1,20,000", formula: "Goodwill = Super Profit × Years' Purchase", tags: ["goodwill","numerical"], marks: 3, estimatedTime: 120, sourceType: "original" },
    { id: "acc12-cf-001", class: 12, subject: "Accountancy", chapter: "Cash Flow Statement", topic: "Operating Activities", difficulty: "medium", type: "mcq", question: "Depreciation while computing cash from operating activities is:", options: ["Subtracted from net profit", "Added to net profit", "Ignored", "Shown under financing activity"], correctAnswer: 1, explanation: "Depreciation is non-cash expense, so it is added back.", tags: ["cash flow"], marks: 1, estimatedTime: 45, sourceType: "original" },
    { id: "eco12-elast-001", class: 12, subject: "Economics", chapter: "Elasticity of Demand", topic: "Price Elasticity", difficulty: "easy", type: "mcq", question: "When demand changes proportionately more than price, demand is:", options: ["Perfectly inelastic", "Inelastic", "Elastic", "Unitary elastic"], correctAnswer: 2, explanation: "If |Ed| > 1, demand is elastic.", tags: ["elasticity"], marks: 1, estimatedTime: 40, sourceType: "original" },
    { id: "eco12-elast-002", class: 12, subject: "Economics", chapter: "Elasticity of Demand", topic: "Price Elasticity", difficulty: "medium", type: "short", question: "State any two determinants of price elasticity of demand.", options: [], correctAnswer: null, explanation: "Common determinants include availability of substitutes, nature of commodity, and proportion of income spent.", tags: ["elasticity"], marks: 2, estimatedTime: 90, sourceType: "sample" },
    { id: "bus12-staff-001", class: 12, subject: "Business Studies", chapter: "Staffing", topic: "Recruitment", difficulty: "easy", type: "mcq", question: "Recruitment means:", options: ["Selecting best candidate", "Testing employees", "Searching and attracting candidates", "Training employees"], correctAnswer: 2, explanation: "Recruitment is the process of identifying and attracting potential candidates.", tags: ["staffing"], marks: 1, estimatedTime: 45, sourceType: "original" },
    { id: "bus12-market-001", class: 12, subject: "Business Studies", chapter: "Marketing", topic: "Marketing Mix", difficulty: "easy", type: "mcq", question: "Which of these is NOT part of 4Ps?", options: ["Product", "Price", "People", "Promotion"], correctAnswer: 2, explanation: "Classic 4Ps: Product, Price, Place, Promotion.", tags: ["marketing"], marks: 1, estimatedTime: 40, sourceType: "original" },
    { id: "acc11-journal-001", class: 11, subject: "Accountancy", chapter: "Journal", topic: "Rules of Debit and Credit", difficulty: "easy", type: "mcq", question: "Purchase of furniture for cash affects:", options: ["Cash A/c Dr, Furniture A/c Cr", "Furniture A/c Dr, Cash A/c Cr", "Purchase A/c Dr, Cash A/c Cr", "Cash A/c Dr, Purchase A/c Cr"], correctAnswer: 1, explanation: "Furniture increases (debit), cash decreases (credit).", tags: ["journal"], marks: 1, estimatedTime: 45, sourceType: "original" },
    { id: "eco11-demand-001", class: 11, subject: "Economics", chapter: "Demand", topic: "Law of Demand", difficulty: "easy", type: "truefalse", question: "Law of demand states that demand rises with rise in price, ceteris paribus.", options: ["True", "False"], correctAnswer: 1, explanation: "It is inverse relation: when price rises, quantity demanded falls.", tags: ["demand"], marks: 1, estimatedTime: 30, sourceType: "original" },
    { id: "acc12-adm-001", class: 12, subject: "Accountancy", chapter: "Partnership", topic: "Admission", difficulty: "medium", type: "assertion", question: "Assertion: Sacrificing ratio is needed at admission. Reason: Existing partners surrender part of old share in favour of new partner.", options: ["Both true and reason explains assertion", "Both true but reason does not explain", "Assertion true, reason false", "Assertion false, reason true"], correctAnswer: 0, explanation: "Both statements are true and reason correctly explains assertion.", tags: ["admission"], marks: 1, estimatedTime: 50, sourceType: "original" },
    { id: "eco12-income-001", class: 12, subject: "Economics", chapter: "National Income", topic: "GDP and NNP", difficulty: "medium", type: "case", question: "A car company sells intermediate parts to its own assembly unit. Explain why only final value is counted in GDP.", options: [], correctAnswer: null, explanation: "To avoid double counting; GDP includes only final goods/services value.", tags: ["national income"], marks: 4, estimatedTime: 180, sourceType: "sample" }
  ];

  return { classes: classes, formulas: formulas, definitions: definitions, questions: questions };
})();
