export const SUBJECTS = ['accountancy','business','economics','english','information'];
export const SUBJECT_NAMES = {
  accountancy:'Accountancy',
  business:'Business Studies',
  economics:'Economics',
  english:'English Core',
  information:'Information Technology'
};
export const SUBJECT_ICONS = {
  accountancy:'₹',
  business:'◈',
  economics:'∿',
  english:'Aa',
  information:'</>'
};
export const SUBJECT_COLORS = {
  accountancy:'#0f2a44',
  business:'#14532d',
  economics:'#7c3aed',
  english:'#be123c',
  information:'#0369a1'
};
export const CURRICULUM = {
  11:{
    accountancy:{
      desc:"The foundation year: meaning, theory base, recording, trial balance, depreciation and provisions.",
      chapters:[
        {title:"Introduction to Accounting", topics:["Meaning & Objectives","Basic Terms","Accounting Principles"], keyPoints:["Accounting is the art of recording, classifying and summarising financial transactions.","Qualitative characteristics: Reliability, Relevance, Understandability, Comparability.","Accounting equation: Assets = Liabilities + Capital."]},
        {title:"Theory Base of Accounting", topics:["GAAP","Accounting Standards","Base Assumptions"], keyPoints:["GAAP = Generally Accepted Accounting Principles.","Fundamental assumptions: Going Concern, Consistency, Accrual.","Accounting standards ensure uniform practice."]},
        {title:"Recording of Transactions — I", topics:["Journal","Ledger","Posting"], keyPoints:["Journal is the book of original entry; Ledger is the book of final entry.","Double entry: every debit has a credit.","Ledger posting transfers journal entries to respective accounts."]},
        {title:"Recording of Transactions — II", topics:["Cash Book","Bank Transactions","Subsidiary Books"], keyPoints:["Cash Book is both journal and ledger for cash.","Three-column Cash Book has Cash, Bank and Discount columns.","Subsidiary books: Purchases, Sales, Returns."]},
        {title:"Bank Reconciliation Statement", topics:["Need for BRS","Causes of Difference","Preparation"], keyPoints:["BRS reconciles Cash Book and Pass Book balances.","Cheques issued but not presented cause difference.","Uncredited cheques and bank charges are common reasons."]},
        {title:"Trial Balance & Rectification", topics:["Trial Balance","Errors","Rectification"], keyPoints:["Trial Balance checks arithmetical accuracy, not absolute accuracy.","Errors of principle and omission don't affect tally.","Suspense account holds difference temporarily."]},
        {title:"Depreciation, Provisions & Reserves", topics:["Depreciation","Methods","Provisions vs Reserves"], keyPoints:["Depreciation is fall in value due to use, time, obsolescence.","SLM: (Cost - Scrap)/Life. WDV: fixed % on written down value.","Provision is charge against profit; Reserve is appropriation of profit."]},
        {title:"Bill of Exchange", topics:["Meaning","Parties","Accounting Treatment"], keyPoints:["Bill of Exchange is an unconditional order to pay.","Drawer, Drawee, Payee are the three parties.","Days of grace: 3 extra days after due date."]},
      ]
    },
    business:{
      desc:"Foundations of business: nature, forms, public sector, business services and social responsibility.",
      chapters:[
        {title:"Nature & Purpose of Business", topics:["Concept","Characteristics","Objectives"], keyPoints:["Business = economic activity done regularly for profit.","Characteristics: Creation of utility, Risk, Profit motive.","Objectives: Economic, Social, Human."]},
        {title:"Forms of Business Organisation", topics:["Sole Proprietorship","Partnership","Hindu Undivided Family"], keyPoints:["Sole proprietorship: one owner, unlimited liability.","Partnership deed defines mutual rights.","HUF governed by Hindu Law, Karta has unlimited liability."]},
        {title:"Public, Private & Global Enterprise", topics:["Departmental Undertaking","Statutory Corporation","Government Company"], keyPoints:["LIC, FCI are statutory corporations.","Government Company: 51% holding by government.","MNCs operate in more than one nation."]},
        {title:"Business Services", topics:["Banking","Insurance","Warehousing"], keyPoints:["e-Banking: ECS, RTGS, NEFT, EFT.","Insurance: Indemnity, Insurable interest, Utmost good faith.","Warehousing creates time utility."]},
        {title:"Emerging Modes of Business", topics:["e-Business","Outsourcing","Smart Cards"], keyPoints:["e-Business scope wider than e-Commerce.","Outsourcing: BPO and KPO.","e-Business requires computerisation."]},
        {title:"Social Responsibility & Business Ethics", topics:["Responsibility to Stakeholders","Environment Protection","Ethics"], keyPoints:["Business must protect environment: pollution control.","Ethics = moral principles guiding business.","CSR is responsibility towards society."]},
      ]
    },
    economics:{
      desc:"Statistics for Economics and Introductory Microeconomics: collection, organisation and basic theory.",
      chapters:[
        {title:"Introduction to Economics & Statistics", topics:["Economics","Statistics","Scarcity"], keyPoints:["Scarcity: resources are limited, wants unlimited.","Statistics deals with collection, organisation, presentation.","Micro vs Macro distinction."]},
        {title:"Collection of Data", topics:["Sources","Methods","Census vs Sample"], keyPoints:["Primary data collected first-hand; secondary already collected.","Census covers all units, sample covers representative units.","Random vs non-random sampling."]},
        {title:"Organisation of Data", topics:["Classification","Frequency Distribution","Variables"], keyPoints:["Raw data to frequency distribution.","Continuous vs discrete variables.","Exclusive vs inclusive class intervals."]},
        {title:"Presentation of Data", topics:["Tables","Diagrams","Graphs"], keyPoints:["Bar diagram, pie diagram, histogram, frequency polygon.","Ogive shows cumulative frequency.","Time series graphs show trends."]},
        {title:"Measures of Central Tendency", topics:["Mean","Median","Mode"], keyPoints:["Mean = ΣX / N. Sensitive to extremes.","Median = middle value after arrangement.","Mode = most frequent value."]},
        {title:"Correlation", topics:["Meaning","Types","Methods"], keyPoints:["Correlation measures direction and degree of relationship.","r ranges -1 to +1.","Scatter diagram gives visual idea."]},
        {title:"Introduction to Microeconomics", topics:["Central Problems","PPF","Opportunity Cost"], keyPoints:["What, How, For whom to produce = central problems.","PPF shows combinations of two goods with given resources.","Opportunity cost is next best alternative foregone."]},
        {title:"Consumer's Equilibrium & Demand", topics:["Utility","Equilibrium","Demand Law"], keyPoints:["TU, MU; MU falls as consumption rises.","Equilibrium: MUx / Px = MUy / Py.","Demand falls with price rise (ceteris paribus)."]},
      ]
    },
    english:{
      desc:"Reading comprehension, writing skills and literature: Hornbill, Snapshots, Woven Words.",
      chapters:[
        {title:"Reading Comprehension", topics:["Factual Passages","Discursive Passages","Note Making"], keyPoints:["Skim for gist, scan for detail.","Note-making: heading, sub-heading, abbreviations.","Summary in one-third words."]},
        {title:"Writing Skills", topics:["Notice","Poster","Advertisement"], keyPoints:["Notice: 50 words, box format, date, heading.","Poster: visual appeal, slogan, brevity.","Classified vs Display ads."]},
        {title:"Grammar", topics:["Tenses","Modals","Determiners"], keyPoints:["Tense consistency is key.","Modals: can/could, may/might, must/should.","Determiners: articles, demonstratives."]},
        {title:"Hornbill — Prose", topics:["The Portrait of a Lady","A Photograph","We’re Not Afraid to Die"], keyPoints:["Portrait of a Lady = grandmother's character sketch.","A Photograph = transience of life.","We’re Not Afraid = courage and family unity."]},
        {title:"Hornbill — Poetry", topics:["A Photograph","The Laburnum Top","The Voice of the Rain"], keyPoints:["Poetic devices: imagery, personification.","Laburnum Top = goldfinch and laburnum.","Voice of the Rain = cycle of rain and poetry."]},
        {title:"Snapshots", topics:["The Summer of Beautiful White Horse","The Address","Ranga’s Marriage"], keyPoints:["Mourad and Aram = honesty vs temptation.","The Address = post-war trauma.","Ranga’s Marriage = arranged match."]},
      ]
    },
    information:{
      desc:"IT 802: Employability, Computer Organization, Networking, DBMS with MySQL.",
      chapters:[
        {title:"Communication Skills", topics:["Elements","7Cs","Non-verbal"], keyPoints:["Communication: Latin commūnicāre = to share.","7Cs: Clear, Concise, Concrete, Correct, Coherent, Complete, Courteous.","Non-verbal: gestures, posture, eye contact."]},
        {title:"Self-Management Skills", topics:["Strengths/Weakness","Grooming","SMART Goals"], keyPoints:["SMART: Specific, Measurable, Achievable, Realistic, Time-bound.","Time management: prioritize, no-disturbance zone.","Teamwork = common goal."]},
        {title:"Computer Organization", topics:["IPO","CPU","Memory"], keyPoints:["IPO cycle: Input → Process → Output.","CPU = ALU + CU. RAM volatile, ROM non-volatile.","Cache bridges RAM and CPU speed."]},
        {title:"Networking & Internet — I", topics:["ARPANET","Transmission Media","Devices"], keyPoints:["ARPANET 1969, NSFNET 1984.","Guided: twisted pair, coaxial, fibre. Unguided: microwave, radio.","Hub broadcasts, Switch unicasts, Router connects networks."]},
        {title:"Networking & Internet — II", topics:["Topologies","PAN/LAN/MAN/WAN","Web Terms"], keyPoints:["Bus, Star, Ring, Tree, Mesh.","PAN 10m, LAN 1km, MAN 50km, WAN 1000km.","URL, HTTP, DNS, IP vs MAC."]},
        {title:"DBMS & MySQL", topics:["CREATE","INSERT","SELECT","UPDATE/DELETE"], keyPoints:["CREATE DATABASE, USE, SHOW, DROP.","INSERT INTO, ALTER TABLE.","SELECT with WHERE, BETWEEN, IN, LIKE, DISTINCT."]},
      ]
    }
  },
  12:{
    accountancy:{
      desc:"Partnership, Company Accounts, Financial Statements and Cash Flow for board preparation.",
      chapters:[
        {title:"Accounting for Partnership — Basics", topics:["Partnership Deed","Profit Sharing","Capital Accounts"], keyPoints:["Deed defines ratio, interest on capital, salary.","Fixed vs Fluctuating capital.","P&L Appropriation shows distribution."]},
        {title:"Goodwill: Nature & Valuation", topics:["Meaning","Types","Methods"], keyPoints:["Goodwill = reputation, excess earning capacity.","Average Profit, Super Profit, Capitalisation methods.","Average profit = sum of profits / number of years."]},
        {title:"Admission of a Partner", topics:["New Ratio","Sacrificing Ratio","Revaluation"], keyPoints:["Sacrificing Ratio = Old Ratio - New Ratio.","Gaining Ratio = New Ratio - Old Ratio.","Revaluation A/c records change in asset/liability values."]},
        {title:"Retirement & Death of a Partner", topics:["New Ratio","Gaining Ratio","Adjustment"], keyPoints:["Retiring partner's share settled via capital or loan.","Gaining Ratio used for goodwill adjustment.","Executor entitled to share till death."]},
        {title:"Dissolution of Partnership Firm", topics:["Dissolution vs Reconstitution","Realisation A/c","Settlement"], keyPoints:["Realisation A/c records sale of assets and payment of liabilities.","Dissolution expenses borne as per agreement.","Cash A/c is prepared last."]},
        {title:"Company Accounts — Issue of Shares", topics:["Share Capital","Issue at Par/Premium","Calls"], keyPoints:["Share capital: Authorised, Issued, Subscribed, Called-up, Paid-up.","Securities premium cannot be used for dividend.","Calls in arrears deducted from called-up capital."]},
        {title:"Issue & Redemption of Debentures", topics:["Debenture","Issue","Redemption"], keyPoints:["Debenture is loan capital, carries fixed interest.","Issue at par, premium, discount.","Redemption via lump sum or instalments."]},
        {title:"Financial Statements of a Company", topics:["Statement of Profit & Loss","Balance Sheet","Notes"], keyPoints:["Schedule III format prescribed.","Revenue from Operations vs Other Income.","Major heads: Equity, Non-current, Current."]},
        {title:"Analysis of Financial Statements", topics:["Comparative","Common Size","Ratio Analysis"], keyPoints:["Comparative shows absolute and % change.","Common size takes common base (e.g. revenue =100%).","Liquidity, Solvency, Activity, Profitability ratios."]},
        {title:"Cash Flow Statement", topics:["Operating","Investing","Financing"], keyPoints:["AS-3 governs Cash Flow.","Operating: principal revenue activities.","Investing: purchase/sale of non-current assets."]},
      ]
    },
    business:{
      desc:"Management, Financial Management, Markets and Consumer Protection — the full Class 12 syllabus.",
      chapters:[
        {title:"Nature & Significance of Management", topics:["Concept","Characteristics","Functions"], keyPoints:["Management is goal-oriented, pervasive, multi-dimensional.","Functions: Planning, Organising, Staffing, Directing, Controlling.","Coordination is essence of management."]},
        {title:"Principles of Management", topics:["Fayol","Taylor","Comparison"], keyPoints:["Fayol: 14 principles (Division of work, Authority, Discipline).","Taylor: Scientific Management (Time, Motion studies).","Fayol universal, Taylor shop-floor."]},
        {title:"Business Environment", topics:["Dimensions","Demonetisation","Impact"], keyPoints:["Dimensions: Economic, Social, Tech, Political, Legal.","Demonetisation: Nov 8, 2016.","Environment enables first-mover advantage."]},
        {title:"Planning", topics:["Process","Types","Limitations"], keyPoints:["Planning is primary function.","Types: Objectives, Strategy, Policy, Procedure, Rule, Budget.","Limitations: rigidity, cost, time."]},
        {title:"Organising", topics:["Structure","Formal/Informal","Delegation"], keyPoints:["Organising = identifying and grouping activities.","Span vs Structure.","Delegation: Authority, Responsibility, Accountability."]},
        {title:"Staffing", topics:["Recruitment","Selection","Training"], keyPoints:["Staffing fills positions.","Internal vs External recruitment.","Training vs Development vs Education."]},
        {title:"Directing", topics:["Supervision","Motivation","Leadership","Communication"], keyPoints:["Hierarchy of needs: Maslow.","Leadership styles: Autocratic, Democratic, Laissez-faire.","Communication: Formal vs Informal (grapevine)."]},
        {title:"Controlling", topics:["Process","Techniques","Relation with Planning"], keyPoints:["Controlling measures actual vs standard.","Techniques: Budgetary control, Break-even, MIS.","Planning and Controlling are inseparable twins."]},
        {title:"Financial Management", topics:["Decisions","Capital Structure","Dividends"], keyPoints:["Investment, Financing, Dividend decisions.","Capital structure = Debt + Equity.","Trading on Equity benefits when ROI > interest."]},
        {title:"Financial Markets", topics:["Money vs Capital","Stock Exchange","SEBI"], keyPoints:["Money market <1 year; Capital market >1 year.","Primary vs Secondary market.","SEBI objectives: protect investors, regulate."]},
        {title:"Marketing", topics:["Concepts","Mix","Functions"], keyPoints:["4Ps: Product, Price, Place, Promotion.","Branding, Packaging, Labelling are product decisions.","Channels of distribution."]},
        {title:"Consumer Protection", topics:["Importance","Rights","Responsibilities"], keyPoints:["Six rights: Safety, Information, Choice, Heard, Redressal, Education.","Consumer Protection Act 2019.","Three-tier redressal: District, State, National."]},
      ]
    },
    economics:{
      desc:"Microeconomics and Macroeconomics with Indian Economic Development perspective.",
      chapters:[
        {title:"Introduction & Central Problems", topics:["Scarcity","PPF","Opportunity Cost"], keyPoints:["Economy faces what, how, for whom.","PPF concave due to increasing MOC.","Opportunity cost guides choice."]},
        {title:"Consumer Equilibrium", topics:["Utility","Indifference Curve","Budget Line"], keyPoints:["Cardinal: MUx/Px = MUy/Py.","Ordinal: IC tangent to budget line.","MU curve falls, TU rises at diminishing rate."]},
        {title:"Demand & Elasticity", topics:["Law of Demand","Elasticity","Exceptions"], keyPoints:["Demand ∝ 1/Price.","Ed = %ΔQ / %ΔP.","Elastic, inelastic, unitary, perfectly elastic/inelastic."]},
        {title:"Production & Costs", topics:["Production Function","Returns","Costs"], keyPoints:["TP, MP, AP. Law of variable proportions.","TC = TFC + TVC. MC = ΔTC/ΔQ.","Costs derived from production."]},
        {title:"Supply & Market Forms", topics:["Law of Supply","Market Equilibrium","Forms"], keyPoints:["Supply ∝ Price.","Equilibrium where Qd = Qs.","Perfect competition, Monopoly, Monopolistic, Oligopoly."]},
        {title:"National Income", topics:["Circular Flow","Aggregates","Measurement"], keyPoints:["GDP, NDP, GNP, NNP at MP/FC.","Value added = Value of output - Intermediate.","Income, Expenditure, Product methods."]},
        {title:"Money & Banking", topics:["Money","Commercial Banks","Central Bank"], keyPoints:["Money: medium, measure, store, standard.","Credit creation via money multiplier = 1/CRR.","Repo, Reverse Repo, CRR, SLR, Open Market Operations."]},
        {title:"Determination of Income & Employment", topics:["AD/AS","Multiplier","Equilibrium"], keyPoints:["AD = C + I + G + (X-M).","Multiplier k = 1/(1-MPC) = 1/MPS.","Equilibrium where AD = AS; at full employment, inflationary/deflationary gap."]},
        {title:"Government Budget & Economy", topics:["Budget","Receipts","Expenditure"], keyPoints:["Revenue vs Capital receipts/expenditure.","Fiscal deficit = Total expenditure - Total receipts excl. borrowings.","Primary deficit = Fiscal deficit - Interest payments."]},
        {title:"Balance of Payments & Exchange Rate", topics:["BoP","Exchange Rate","Foreign Exchange Market"], keyPoints:["Current vs Capital account.","Fixed vs Flexible vs Managed floating.","Devaluation vs Depreciation (fixed vs flexible)."]},
        {title:"Indian Economic Development", topics:["Pre/Post 1991","Poverty","Human Capital"], keyPoints:["LPG reforms 1991.","Poverty: absolute vs relative, headcount ratio.","Human capital vs Human development."]},
      ]
    },
    english:{
      desc:"Flamingo, Vistas, reading and writing for the board exam.",
      chapters:[
        {title:"Reading Skills", topics:["Comprehension","Note Making","Summary"], keyPoints:["Unseen passage: 12 marks.","Note-making: title, notes, abbreviations.","Summary: 50-60 words."]},
        {title:"Advanced Writing", topics:["Notice","Poster","Formal Letters","Article"], keyPoints:["Business letters: order, enquiry, complaint.","Speech, Debate, Report.","Invitation: formal vs informal."]},
        {title:"Flamingo — Prose", topics:["The Last Lesson","Lost Spring","Deep Water"], keyPoints:["Last Lesson = linguistic chauvinism.","Lost Spring = child labour (Saheb, Mukesh).","Deep Water = overcoming fear (Douglas)."]},
        {title:"Flamingo — Poetry", topics:["My Mother at Sixty-six","Keeping Quiet","A Thing of Beauty"], keyPoints:["Kamala Das: fear of loss.","Neruda: mutual understanding, silence.","Keats: beauty is eternal joy."]},
        {title:"Vistas", topics:["The Third Level","The Tiger King","Journey to the End of Earth"], keyPoints:["Third Level = escapism, time travel.","Tiger King = satire on power.","Journey = Antarctica, climate change."]},
        {title:"Vistas — Continued", topics:["The Enemy","On the Face of It","Memories of Childhood"], keyPoints:["The Enemy = Sadao, humanity vs duty.","Derry & Mr Lamb = disability, loneliness.","Zitkala-Sa & Bama = discrimination."]},
      ]
    },
    information:{
      desc:"Repeat and advance: Employability, IT Tools, Web Apps, Security and Project.",
      chapters:[
        {title:"Employability Skills — Revision", topics:["Communication","Self-Management","ICT","Entrepreneurship","Green Skills"], keyPoints:["Revision of Class 11 units.","ICT: components, peripherals.","Green skills = sustainability."]},
        {title:"Database Concepts", topics:["DBMS","RDBMS","Keys"], keyPoints:["DBMS vs RDBMS.","Primary, Candidate, Foreign keys.","Normalization reduces redundancy."]},
        {title:"Operating Web-Based Applications", topics:["Online Transactions","Security","Net Etiquette"], keyPoints:["E-commerce, e-Governance.","Phishing, spam, secure HTTPS.","Net etiquette and cyber law."]},
        {title:"Work Integrated Learning", topics:["Project","Viva","File"], keyPoints:["Practical 40 marks: project + viva.","File presentation matters.","Documentation and innovation."]},
      ]
    }
  }
};

export function getChapters(grade, subject){
  return CURRICULUM[grade]?.[subject]?.chapters || [];
}
export function getChapter(grade, subject, idx){
  return getChapters(grade,subject)[idx] || null;
}
