export const FORMULAS = [
  {subject:"accountancy", chapter:"Goodwill: Nature & Valuation", name:"Average Profit", formula:"Average Profit = Total Profits / Number of years", vars:"Total profits = sum of profits of given years", example:"Profits 40k+50k+60k =150k/3=50k", mistake:"Don't forget to adjust abnormal losses/gains before averaging."},
  {subject:"accountancy", chapter:"Goodwill: Nature & Valuation", name:"Goodwill – Average Profit Method", formula:"Goodwill = Average Profit × Number of years' purchase", vars:"Purchase = multiplier agreed", example:"Average 50k ×2 =1,00,000", mistake:"Purchase years ≠ number of years of profits."},
  {subject:"accountancy", chapter:"Goodwill: Nature & Valuation", name:"Super Profit", formula:"Super Profit = Average Profit − Normal Profit", vars:"Normal Profit = Capital Employed × Normal Rate /100", example:"Avg 80k − (5,00,000×10%)=30k", mistake:"Normal profit uses capital employed at normal rate."},
  {subject:"accountancy", chapter:"Goodwill: Nature & Valuation", name:"Goodwill – Super Profit Method", formula:"Goodwill = Super Profit × Years' purchase", vars:"Years' purchase as agreed", example:"Super 30k×3=90k", mistake:"Super profit can be negative → no goodwill."},
  {subject:"accountancy", chapter:"Goodwill: Nature & Valuation", name:"Goodwill – Capitalisation Method", formula:"Capitalised Value = Average Profit ×100 / Normal Rate ; Goodwill = Capitalised Value − Capital Employed", vars:"Capital employed = total assets − outside liabilities", example:"60k×100/10=6,00,000−4,00,000=2,00,000", mistake:"Capital employed is net assets, not gross."},
  {subject:"accountancy", chapter:"Depreciation, Provisions & Reserves", name:"Depreciation (SLM)", formula:"Annual Depreciation = (Cost − Scrap Value) / Useful Life", vars:"Cost includes installation", example:"(1,00,000−10,000)/10=9,000", mistake:"Scrap not subtracted in WDV."},
  {subject:"accountancy", chapter:"Cash Flow Statement", name:"Cash from Operations (Indirect)", formula:"Operating Profit before working capital changes ± Working capital adjustments − Tax paid", vars:"Add depreciation, loss on sale; deduct gains", example:"Net profit 50k + Dep 10k − Gain 5k + Stock decrease 4k =59k", mistake:"Interest/dividend have separate sections."},
  {subject:"accountancy", chapter:"Analysis of Financial Statements", name:"Current Ratio", formula:"Current Assets / Current Liabilities", vars:"CA = stock+debtors+cash etc.", example:"4,00,000/2,00,000=2:1", mistake:"Ideal 2:1, but industry varies."},
  {subject:"accountancy", chapter:"Analysis of Financial Statements", name:"Liquid Ratio", formula:"Liquid Assets / Current Liabilities", vars:"Liquid = CA − Inventory − Prepaid", example:"3,00,000/2,00,000=1.5:1", mistake:"Inventory not liquid."},
  {subject:"economics", chapter:"Demand & Elasticity", name:"Price Elasticity (Percentage)", formula:"Ed = (% Change in Qty Demanded) / (% Change in Price)", vars:"%Δ = (New−Old)/Old ×100", example:"Price 10→8 (−20%), Qty 100→120 (+20%) => Ed=1", mistake:"Use absolute values; sign shows direction."},
  {subject:"economics", chapter:"Money & Banking", name:"Money Multiplier", formula:"Multiplier = 1 / CRR ; Total Deposits = Initial Deposit × Multiplier", vars:"CRR in decimal (10% =0.10)", example:"CRR 0.10 => multiplier 10 => 1,000×10=10,000", mistake:"CRR 20% => multiplier 5, not 0.2."},
  {subject:"economics", chapter:"National Income", name:"NDP at FC", formula:"NDP at FC = GDP at MP − Depreciation − Net Indirect Tax", vars:"GDP at MP → NDP at FC conversion", example:"500−30−20=450", mistake:"Don't forget net factor income for NNP."},
  {subject:"economics", chapter:"Determination of Income & Employment", name:"Investment Multiplier", formula:"k = 1 / (1 − MPC) = 1 / MPS", vars:"MPC + MPS =1", example:"MPC 0.8 => k=5", mistake:"Multiplier >1 always."},
  {subject:"economics", chapter:"Government Budget & Economy", name:"Fiscal Deficit", formula:"Fiscal Deficit = Total Expenditure − Total Receipts (excluding borrowings)", vars:"Total receipts = Revenue + Capital non-debt", example:"Fiscal 10,000 − interest 4,000 = Primary 6,000", mistake:"Primary Deficit = Fiscal − Interest payments."},
];

export const DEFINITIONS = [
  {term:"Goodwill", subject:"accountancy", definition:"Goodwill is the value of the reputation of a firm in respect of profits expected in future over and above the normal profits. It is an intangible asset that brings excess earning capacity.", related:["Capital","Super Profit","Average Profit"]},
  {term:"Partnership Deed", subject:"accountancy", definition:"A written agreement among partners containing terms related to profit sharing, capital contribution, interest on capital, drawings, salary and other matters.", related:["Profit Sharing Ratio","Capital Accounts"]},
  {term:"Sacrificing Ratio", subject:"accountancy", definition:"The ratio in which old partners sacrifice their share of profit in favour of the new partner. Sacrificing Ratio = Old Ratio − New Ratio.", related:["Gaining Ratio","New Ratio"]},
  {term:"Revaluation Account", subject:"accountancy", definition:"An account prepared to record changes in value of assets and liabilities at the time of admission, retirement or death of a partner. Profit/loss is transferred to old partners in old ratio.", related:["Realisation Account","Capital Account"]},
  {term:"Securities Premium", subject:"accountancy", definition:"Excess of issue price over face value of a share. Governed by Companies Act Sec 52; can be used for bonus issue, writing off preliminary expenses, buy-back, etc., but not for dividend.", related:["Share Capital","Calls in Arrears"]},
  {term:"Cash Flow Statement", subject:"accountancy", definition:"A statement that shows flow of cash and cash equivalents under Operating, Investing and Financing activities during a period, as per AS-3.", related:["Operating Activities","Investing Activities"]},
  {term:"Current Ratio", subject:"accountancy", definition:"Liquidity ratio measuring firm's ability to meet short-term obligations: Current Assets / Current Liabilities. Ideal is 2:1.", related:["Liquid Ratio","Working Capital"]},
  {term:"Planning", subject:"business", definition:"Deciding in advance what to do, how to do, when to do and who is to do it. It is the primary function of management and bridges the gap from where we are to where we want to be.", related:["Organising","Controlling"]},
  {term:"Scalar Chain", subject:"business", definition:"Chain of authority from top to bottom linking all managers at all levels. Gang plank is a shorter route to bypass scalar chain in emergency.", related:["Unity of Command","Hierarchy"]},
  {term:"Delegation", subject:"business", definition:"Transfer of authority from superior to subordinate along with responsibility and accountability. Elements: Authority, Responsibility, Accountability.", related:["Decentralisation","Authority"]},
  {term:"Capital Structure", subject:"business", definition:"Mix of debt and equity used to finance the firm. Optimal structure balances risk and return, maximises value and minimises cost of capital.", related:["Trading on Equity","Financial Leverage"]},
  {term:"Money Multiplier", subject:"economics", definition:"Number of times commercial banks can create credit from initial deposits. Multiplier = 1 / Reserve Ratio (CRR).", related:["CRR","Credit Creation"]},
  {term:"Price Elasticity of Demand", subject:"economics", definition:"Degree of responsiveness of quantity demanded to change in price. Ed = % change in quantity / % change in price. Elastic (>1), Inelastic (<1), Unitary (=1).", related:["Demand","Giffen Goods"]},
  {term:"Fiscal Deficit", subject:"economics", definition:"Excess of total expenditure over total receipts excluding borrowings. Indicates total borrowing requirement of government.", related:["Primary Deficit","Revenue Deficit"]},
  {term:"Balance of Payments", subject:"economics", definition:"Systematic record of all economic transactions between residents of a country and rest of world in a period. Current account + Capital account + Errors.", related:["Current Account","Capital Account"]},
  {term:"MySQL DISTINCT", subject:"information", definition:"Keyword that eliminates duplicate rows from SELECT result. Example: SELECT DISTINCT city FROM student;", related:["SELECT","ALL"]},
  {term:"MAC Address", subject:"information", definition:"12-digit hexadecimal physical address assigned to NIC by manufacturer, permanent, written as MM:MM:MM:SS:SS:SS. Second half is serial.", related:["IP Address","NIC"]},
  {term:"IP Address", subject:"information", definition:"32-bit (4 bytes) logical address of a node, e.g., 59.177.134.72, assigned by administrator/ISP, can change when network changes.", related:["MAC Address","DNS"]},
];

export const REVISION_CONTENT = {
  "Accountancy · Partnership": {
    concepts:["Partnership deed and its contents.","Types of partners: Active, Sleeping, Nominal, Partner by estoppel.","Fixed vs Fluctuating capital methods.","Profit and Loss Appropriation account format."],
    formulas:["Sacrificing Ratio = Old − New","Gaining Ratio = New − Old","Interest on Capital = Capital × Rate × Time","Interest on Drawings (when withdrawn evenly) = Total Drawings × Rate × Average period"],
    mistakes:["Confusing sacrificing and gaining ratio.","Forgetting to revalue assets/liabilities before new ratio.","Treating revaluation profit as partners' capital directly instead of via Revaluation A/c."],
    tips:["Always prepare Revaluation A/c first on admission/retirement.","New Ratio = Old Ratio − Sacrificing + Gaining (verify sums to 1)."]
  },
  "Goodwill": {
    concepts:["Goodwill is intangible, valuable only when profitable.","Factors: location, efficiency, market, contracts."],
    formulas:["Average profit method, Super profit method, Capitalisation method (see Formula Bank)"],
    mistakes:["Using gross profit instead of net operating profit.","Not adjusting abnormal items before averaging."],
    tips:["Read question: 'years' purchase' is multiplier, not years of data.","Show steps: Average → Normal → Super → Goodwill."]
  }
};
