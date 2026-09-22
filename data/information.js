/* CBSE Commerce Bank: information.js */
(function (W) {
  'use strict';
  W.QB = W.QB || {};
  W.QB['it-11'] = {
  "chapters": [
    {
      "t": "Computer Fundamentals & Architecture",
      "k": [
        "Von Neumann computer architecture: CPU (ALU, CU, Registers), Memory unit, Input and Output devices.",
        "Memory hierarchy: Cache, Primary Memory (RAM, ROM), Secondary Storage (SSD, HDD, Optical).",
        "RAM is volatile read-write memory; ROM is non-volatile holding firmware BIOS / UEFI bootstrap loaders.",
        "Data representation: Binary, Octal, Decimal, Hexadecimal; Logic gates (AND, OR, NOT, NAND, NOR, XOR)."
      ],
      "mcq": [
        [
          "Which component of the Central Processing Unit directs and coordinates all operations across the computer system?",
          [
            "Arithmetic Logic Unit (ALU)",
            "Control Unit (CU)",
            "Memory Data Register",
            "Solid State Drive"
          ],
          1,
          "The Control Unit decodes instructions and manages execution timing signals."
        ],
        [
          "RAM is characterized as volatile memory because:",
          [
            "It cannot be rewritten",
            "It loses its stored data contents immediately when electric power is switched off",
            "It operates at slow mechanical speeds",
            "It is stored on magnetic tapes"
          ],
          1,
          "Volatile semiconductor RAM requires electrical power to retain binary states."
        ],
        [
          "Which type of high-speed memory is positioned between the CPU registers and main RAM to minimize latency?",
          [
            "Virtual Memory",
            "Cache Memory",
            "Secondary Flash Memory",
            "EEPROM"
          ],
          1,
          "SRAM cache stores frequently referenced data instructions to accelerate CPU throughput."
        ],
        [
          "Convert the binary number 1101_2 into its decimal equivalent:",
          [
            "11",
            "13",
            "15",
            "17"
          ],
          1,
          "1*8 + 1*4 + 0*2 + 1*1 = 8 + 4 + 0 + 1 = 13."
        ],
        [
          "Which universal logic gate produces an output of 0 only when all its inputs are 1?",
          [
            "NOR Gate",
            "NAND Gate",
            "XOR Gate",
            "AND Gate"
          ],
          1,
          "NAND gate is the inverse of AND; output is 0 exclusively when all inputs are 1."
        ]
      ],
      "sh": [
        [
          "Distinguish between Static RAM (SRAM) and Dynamic RAM (DRAM).",
          [
            "SRAM: Uses flip-flops, faster, does not require periodic refreshing, expensive (used in CPU Cache).",
            "DRAM: Uses capacitors and transistors, slower, requires periodic refreshing, denser and cheaper (used in Main RAM)."
          ]
        ],
        [
          "What is the role of BIOS / UEFI during the computer booting sequence?",
          [
            "Firmware executing Power-On Self-Test (POST), initializing motherboard hardware, and loading OS kernel from storage."
          ]
        ],
        [
          "Convert decimal 45 into binary representation.",
          [
            "45 / 2 = 22 rem 1; 22 / 2 = 11 rem 0; 11 / 2 = 5 rem 1; 5 / 2 = 2 rem 1; 2 / 2 = 1 rem 0; 1 / 2 = 0 rem 1 => 101101_2."
          ]
        ],
        [
          "Why are NAND and NOR gates termed 'Universal Gates'?",
          [
            "Because any Boolean logic circuit or gate (AND, OR, NOT, XOR) can be constructed exclusively using only NAND or NOR gates."
          ]
        ]
      ],
      "lg": [
        [
          "Explain the Von Neumann computer architecture and instruction execution cycle.",
          [
            "Functional Units: Central Processing Unit (ALU, CU, Registers), Memory (stored program), and Input/Output sub-systems.",
            "Stored-Program Concept: Both program instructions and data reside together in shared primary memory.",
            "Fetch Stage: Control Unit fetches next instruction from memory location pointed to by Program Counter (PC).",
            "Decode Stage: Instruction register decodes the machine operation code and operand addresses.",
            "Execute Stage: ALU performs arithmetic/logic computations or moves data among registers/memory.",
            "Write-Back Stage: Results are written back to destination registers or RAM."
          ]
        ],
        [
          "Discuss the Computer Memory Hierarchy in terms of speed, capacity, and cost per bit.",
          [
            "Level 1 - CPU Registers: Fastest access (picoseconds), smallest capacity (bytes), highest cost per bit.",
            "Level 2 - Cache Memory (L1, L2, L3): Very fast SRAM located on-die, caching active working sets (megabytes).",
            "Level 3 - Primary Memory (DRAM): Moderately fast, volatile main workspace for active processes (gigabytes).",
            "Level 4 - Secondary Storage (SSD / NVMe / HDD): Non-volatile permanent storage, slower access, massive capacity (terabytes).",
            "Level 5 - Tertiary / Offline Storage (Tapes, Optical): Slowest, highest archival durability, lowest cost per bit."
          ]
        ],
        [
          "Explain the functions and operational differences between System Software and Application Software.",
          [
            "System Software: Operating systems (Windows, Linux), device drivers, and system utilities managing bare-metal hardware resources.",
            "Application Software: End-user specialized programs (spreadsheets, ERPs, web browsers) performing specific business tasks.",
            "Interaction: Applications call system services via OS System Calls / APIs; user interacts with applications.",
            "Dependence: System software runs autonomously and is indispensable; applications run on top of system software."
          ]
        ],
        [
          "Demonstrate Boolean logic simplification using De Morgan's Laws.",
          [
            "Law 1: (A + B)' = A' . B' — The complement of a logical sum equals the product of the individual complements.",
            "Law 2: (A . B)' = A' + B' — The complement of a logical product equals the sum of the individual complements.",
            "Application: Simplifies complex digital circuit gate layouts, reducing silicon transistor counts and propagation delay."
          ]
        ]
      ],
      "cs": [
        [
          "Case: A gaming studio is designing a 3D rendering workstation. The engineer must choose between a SATA SSD (550 MB/s) and an NVMe PCIe Gen4 SSD (7000 MB/s). Justify the selection based on bus architecture.",
          [
            "Select the NVMe PCIe Gen4 SSD.",
            "SATA SSD is bottle-necked by legacy SATA III bus limits (6 Gbps / ~550 MB/s).",
            "NVMe operates directly over high-speed PCIe lanes with lower latency and deep parallel command queues, cutting load times by 90%."
          ]
        ],
        [
          "Case: Write the truth table for a 2-input XOR (Exclusive OR) gate and state its primary arithmetic application.",
          [
            "Truth Table: A=0, B=0 => 0; A=0, B=1 => 1; A=1, B=0 => 1; A=1, B=1 => 0.",
            "Application: XOR acts as the fundamental modulo-2 addition unit in Half Adders and Full Adders in computer ALUs."
          ]
        ]
      ]
    },
    {
      "t": "Operating Systems & Office Productivity Tools",
      "k": [
        "Operating System (OS) is resource manager: Process management, Memory management, File systems, and Device management.",
        "Types of OS: Batch, Multi-programming, Time-sharing, Real-Time (RTOS), Distributed, and Mobile OS (Android, iOS).",
        "Process states: New, Ready, Running, Waiting/Blocked, Terminated; CPU scheduling (FCFS, Round Robin).",
        "Office tools: Word processing, Spreadsheets (formulas, VLOOKUP, Pivot Tables), and Presentation slides."
      ],
      "mcq": [
        [
          "Which operating system scheduling algorithm allocates a fixed quantum of CPU time to each process in turn?",
          [
            "First Come First Served (FCFS)",
            "Round Robin (RR)",
            "Shortest Job First (SJF)",
            "Priority Scheduling"
          ],
          1,
          "Round Robin uses preemption and time slices to ensure fair interactive CPU sharing."
        ],
        [
          "In spreadsheet applications (like Excel/Calc), which formula lookup function searches for a value in the first column of a table?",
          [
            "INDEX()",
            "MATCH()",
            "VLOOKUP()",
            "HLOOKUP()"
          ],
          2,
          "VLOOKUP searches vertically in the leftmost column and returns values from specified column index."
        ],
        [
          "A situation where two or more processes are permanently blocked waiting for resources held by each other is:",
          [
            "Thrashing",
            "Starvation",
            "Deadlock",
            "Context Switching"
          ],
          2,
          "Deadlock occurs when processes are locked in circular wait conditions."
        ],
        [
          "Which file system format is native to modern Microsoft Windows operating systems?",
          [
            "EXT4",
            "FAT32",
            "NTFS",
            "APFS"
          ],
          2,
          "NTFS (New Technology File System) provides journaling, encryption, and ACL file permissions."
        ],
        [
          "In an Excel spreadsheet, cell $C$5 represents what type of cell reference?",
          [
            "Relative Reference",
            "Absolute Reference",
            "Mixed Reference",
            "3D Reference"
          ],
          1,
          "The dollar signs before column and row lock the cell coordinates absolutely when formulas are copied."
        ]
      ],
      "sh": [
        [
          "List the four essential conditions required for a Deadlock (Coffman conditions) to occur.",
          [
            "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait."
          ]
        ],
        [
          "Distinguish between Multitasking and Multiprocessing in Operating Systems.",
          [
            "Multitasking: Single CPU rapidly switches between multiple processes using time slicing.",
            "Multiprocessing: System utilizes two or more physical CPUs/cores executing multiple threads concurrently."
          ]
        ],
        [
          "Explain the function of a Pivot Table in spreadsheet software.",
          [
            "An interactive data analysis tool that quickly summarizes, aggregates, cross-tabulates, and reorganizes large datasets."
          ]
        ],
        [
          "What is the difference between Relative and Absolute cell referencing in spreadsheets?",
          [
            "Relative (e.g. A1) changes automatically when dragged; Absolute ($A$1) remains fixed to exact cell."
          ]
        ]
      ],
      "lg": [
        [
          "Explain the primary functions performed by an Operating System.",
          [
            "Process Management: Creating, scheduling, synchronizing, and terminating concurrent processes via CPU schedulers.",
            "Memory Management: Tracking physical RAM allocation, managing virtual memory paging, and swapping.",
            "File System Management: Organizing directories, managing read/write access permissions, and storage indexing.",
            "Device Management: Interfacing with peripherals using standardized device drivers and buffering.",
            "Security & User Interface: Authentication, process isolation, CLI (shell) and GUI environments."
          ]
        ],
        [
          "Explain the Process State Lifecycle with an annotated state transition diagram.",
          [
            "New: Process is being initialized and loaded into main memory queue.",
            "Ready: Process resides in RAM waiting for CPU allocation by short-term dispatcher.",
            "Running: Instructions are actively executing on CPU core.",
            "Waiting / Blocked: Process yields CPU awaiting I/O completion or event signal.",
            "Terminated: Process completes execution; resources deallocated and exit status returned to parent."
          ]
        ],
        [
          "Discuss essential spreadsheet formulas and techniques used in business accounting.",
          [
            "SUMIF / COUNTIF: Conditional aggregation summing or counting cells matching specified criteria.",
            "VLOOKUP & XLOOKUP: Cross-referencing price sheets and customer databases using unique key lookups.",
            "PMT Function: Calculating monthly loan installments and debenture interest amortizations.",
            "Data Validation: Enforcing constraints on input cells (e.g. valid date ranges, numeric bounds) to prevent errors."
          ]
        ],
        [
          "Compare Command Line Interface (CLI) and Graphical User Interface (GUI).",
          [
            "Efficiency: CLI offers fast scriptable automated workflows for power users; GUI is intuitive for visual navigation.",
            "Resource Consumption: CLI consumes minimal RAM and CPU cycles; GUI requires heavy graphics processing.",
            "Error Tolerance: CLI demands exact syntax; typing errors cause failures; GUI guides choices with dialogs.",
            "Remote Administration: CLI (SSH) is lightweight over low-bandwidth networks; GUI (RDP/VNC) demands high bandwidth."
          ]
        ]
      ],
      "cs": [
        [
          "Case: A finance manager wants to calculate the total salary paid only to employees working in the 'Marketing' department from a sheet with 500 rows. Write the Excel formula.",
          [
            "Formula: =SUMIF(Department_Range, \"Marketing\", Salary_Range)",
            "Example: =SUMIF(C2:C501, \"Marketing\", D2:D501).",
            "The SUMIF function scans department column C and sums corresponding salary values in column D."
          ]
        ],
        [
          "Case: An operating system server experiences thrashing where CPU utilization drops to 2% while disk activity stays at 100%. Explain what is happening and the solution.",
          [
            "Thrashing occurs when active working memory sets exceed available physical RAM, forcing continuous page faults and page swaps to disk.",
            "Solution: Increase physical RAM capacity or reduce degree of multiprogramming by suspending non-critical processes."
          ]
        ]
      ]
    },
    {
      "t": "Computer Networks, Internet & Cyber Security",
      "k": [
        "Network types: PAN, LAN, MAN, WAN; Topologies: Star, Bus, Ring, Mesh, Tree.",
        "OSI 7-Layer Model: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
        "Network devices: NIC, Switch, Router, Gateway, Firewall; Transmission media: Twisted pair, Coaxial, Fiber optic, Wireless.",
        "Cyber security: Phishing, Malware (Viruses, Worms, Trojans, Ransomware), Firewalls, SSL/TLS, Indian IT Act 2000."
      ],
      "mcq": [
        [
          "Which network topology connects all client nodes to a central connecting device like a Switch or Hub?",
          [
            "Bus Topology",
            "Ring Topology",
            "Star Topology",
            "Mesh Topology"
          ],
          2,
          "In Star topology, every workstation is linked directly to a central hub or switch."
        ],
        [
          "Which OSI model layer is responsible for end-to-end reliable packet delivery, flow control, and error correction?",
          [
            "Network Layer",
            "Transport Layer (TCP)",
            "Data Link Layer",
            "Application Layer"
          ],
          1,
          "The Transport layer (TCP) guarantees ordered, error-free end-to-end data transmission."
        ],
        [
          "Which transmission medium offers the highest data transmission bandwidth and immunity to electromagnetic interference?",
          [
            "Unshielded Twisted Pair (UTP)",
            "Coaxial Cable",
            "Fiber Optic Cable",
            "Infrared Waves"
          ],
          2,
          "Fiber optic cables transmit data as light pulses through glass cores, immune to EMI."
        ],
        [
          "A fraudulent email pretending to be a bank asking the recipient to click a link to update passwords is a/an:",
          [
            "DDoS attack",
            "Phishing attack",
            "Trojan injection",
            "SQL Injection"
          ],
          1,
          "Phishing tricks victims into divulging sensitive credentials via deceptive impersonation."
        ],
        [
          "The statutory law governing cyber crimes and digital signatures in India is the:",
          [
            "Companies Act 2013",
            "Information Technology Act 2000 (amended 2008)",
            "Indian Penal Code only",
            "Consumer Protection Act"
          ],
          1,
          "The Information Technology Act 2000 provides legal recognition for electronic transactions and penalizes cyber offenses."
        ]
      ],
      "sh": [
        [
          "Distinguish between a Switch and a Router.",
          [
            "Switch: Operates at Data Link Layer (Layer 2) using MAC addresses to forward frames within a single LAN.",
            "Router: Operates at Network Layer (Layer 3) using IP addresses to route packets between different networks."
          ]
        ],
        [
          "Explain the difference between a Computer Virus and a Computer Worm.",
          [
            "Virus: Attaches to legitimate executable files and requires human execution to propagate.",
            "Worm: Self-replicating standalone program that spreads automatically across network vulnerabilities without host files."
          ]
        ],
        [
          "What is the purpose of an IP Address and a MAC Address?",
          [
            "IP Address: Logical routable address assigned to identify device location on network.",
            "MAC Address: Permanent physical 48-bit hardware address burned into the Network Interface Card (NIC)."
          ]
        ],
        [
          "State two preventive practices to secure personal online accounts from cyber threats.",
          [
            "Enable Multi-Factor Authentication (MFA) and use strong, unique passwords managed with password vaults."
          ]
        ]
      ],
      "lg": [
        [
          "Explain the 7 Layers of the OSI Reference Model and their core functions.",
          [
            "Layer 1 - Physical: Transmission of raw unstructured bit streams over physical media (voltages, light).",
            "Layer 2 - Data Link: Framing, MAC hardware addressing, and local error detection (Ethernet).",
            "Layer 3 - Network: Logical IP addressing and packet routing across intermediate gateways (IP, ICMP).",
            "Layer 4 - Transport: End-to-end process communication, flow control, port addressing (TCP, UDP).",
            "Layer 5 - Session: Establishing, maintaining, and synchronizing communication sessions between applications.",
            "Layer 6 - Presentation: Data formatting, encryption/decryption (SSL/TLS), and compression.",
            "Layer 7 - Application: User interface protocols (HTTP, HTTPS, SMTP, FTP, DNS)."
          ]
        ],
        [
          "Compare Star, Bus, and Mesh Network Topologies.",
          [
            "Star: Easy installation, failure of one node does not impact others; hub failure collapses network.",
            "Bus: Inexpensive cabling; cable break disrupts entire segment, difficult fault isolation.",
            "Mesh: Every node interconnected, highest redundancy and fault tolerance; astronomical cabling and port expenses.",
            "Suitability: Star for modern LAN offices; Mesh for mission-critical core internet backbones."
          ]
        ],
        [
          "Discuss the primary threats in Cyber Security and their counter-measures.",
          [
            "Malware: Viruses, Ransomware, Spyware — countered by endpoint Antivirus, regular patching, and offline backups.",
            "Phishing & Social Engineering: Deceptive emails — countered by employee security awareness training and spam filters.",
            "Man-in-the-Middle (MITM): Packet eavesdropping — countered by HTTPS, SSL/TLS, and VPN encryption.",
            "Denial of Service (DoS/DDoS): Flooding server bandwidth — countered by cloud scrubbing firewalls and rate limiters."
          ]
        ],
        [
          "Explain the key provisions and penalties under the Indian Information Technology Act 2000.",
          [
            "Section 43: Penalizes unauthorized access, downloading data, or introducing computer contaminants with damages.",
            "Section 66C: Identity theft using another's password or digital signature (up to 3 years imprisonment).",
            "Section 66D: Cheating by personation using computer resources.",
            "Section 66E: Violation of personal privacy by publishing private photographs without consent.",
            "Legal Validity: Granted legal sanctity to digital contracts and electronic signatures across Indian commerce."
          ]
        ]
      ],
      "cs": [
        [
          "Case: An e-commerce corporate headquarter has 4 branch buildings located within a 500-meter campus. Recommend the network type, transmission medium, and topology.",
          [
            "Network Type: Campus Local Area Network (CAN / LAN).",
            "Transmission Medium: Multi-mode Fiber Optic cable backbones connecting buildings; CAT6 UTP inside offices.",
            "Topology: Extended Star Topology with building switches connecting to a redundant Core Switch."
          ]
        ],
        [
          "Case: An employee received an email stating their payroll account was locked, providing a link to 'payro11-portal-verify.com'. Explain what attack this is and what the employee must do.",
          [
            "This is a credential Phishing attack using a look-alike spoofed domain.",
            "The employee must NOT click the link or enter credentials.",
            "Immediately report the email to the corporate IT security team and flag it in the mail server."
          ]
        ]
      ]
    }
  ]
};
  W.QB['it-12'] = {
  "chapters": [
    {
      "t": "Relational Database Management Systems & SQL",
      "k": [
        "RDBMS concepts: Relations (tables), Attributes (columns), Tuples (rows), Cardinality, Degree, Primary Key, Foreign Key.",
        "Relational integrity: Entity integrity (no null primary keys) and Referential integrity (foreign key matches valid primary key).",
        "SQL sub-languages: DDL (CREATE, ALTER, DROP), DML (SELECT, INSERT, UPDATE, DELETE), DCL (GRANT, REVOKE).",
        "SQL clauses: WHERE, ORDER BY, GROUP BY, HAVING; Aggregate functions (COUNT, SUM, AVG, MIN, MAX)."
      ],
      "mcq": [
        [
          "In relational database terminology, a single row in a table is formally called a/an:",
          [
            "Attribute",
            "Tuple",
            "Domain",
            "Relation"
          ],
          1,
          "A tuple represents a single distinct record or row of related attribute values."
        ],
        [
          "Which SQL constraint ensures that an attribute column cannot be left empty and must contain unique values for every record?",
          [
            "UNIQUE only",
            "FOREIGN KEY",
            "PRIMARY KEY",
            "CHECK"
          ],
          2,
          "A PRIMARY KEY uniquely identifies tuples and enforces NOT NULL and UNIQUE integrity."
        ],
        [
          "Which SQL clause is used to filter records based on aggregated grouped values?",
          [
            "WHERE",
            "ORDER BY",
            "HAVING",
            "GROUP BY"
          ],
          2,
          "HAVING filters aggregate group summaries, whereas WHERE filters individual tuples before grouping."
        ],
        [
          "Which of the following is a Data Definition Language (DDL) command in SQL?",
          [
            "INSERT",
            "UPDATE",
            "ALTER TABLE",
            "SELECT"
          ],
          2,
          "ALTER TABLE modifies the schema structure of a database table, classifying it as DDL."
        ],
        [
          "A table with 5 columns and 20 rows has a Degree and Cardinality of:",
          [
            "Degree = 20, Cardinality = 5",
            "Degree = 5, Cardinality = 20",
            "Degree = 100, Cardinality = 5",
            "Degree = 4, Cardinality = 19"
          ],
          1,
          "Degree equals number of attributes (5); Cardinality equals number of tuples (20)."
        ]
      ],
      "sh": [
        [
          "Distinguish between Primary Key and Foreign Key.",
          [
            "Primary Key: Uniquely identifies tuples within its own table; cannot contain null values.",
            "Foreign Key: Attribute whose values reference the primary key of another table, enforcing referential integrity."
          ]
        ],
        [
          "Differentiate between WHERE and HAVING clauses in SQL.",
          [
            "WHERE: Filters individual rows before any grouping or aggregation takes place.",
            "HAVING: Filters summary groups after GROUP BY aggregation has been executed."
          ]
        ],
        [
          "What is the function of the DISTINCT keyword in a SQL SELECT query?",
          [
            "Eliminates duplicate rows from the returned result set, displaying each unique entry once."
          ]
        ],
        [
          "Explain the concept of Referential Integrity with an example.",
          [
            "Ensures relationships between tables remain consistent; child foreign key cannot reference non-existent parent primary key."
          ]
        ]
      ],
      "lg": [
        [
          "Explain SQL Data Definition Language (DDL) versus Data Manipulation Language (DML) with query examples.",
          [
            "DDL (Structure): Commands that define and modify schema. Examples: CREATE TABLE Student (Roll INT PRIMARY KEY, Name VARCHAR(50)); ALTER TABLE Student ADD Age INT; DROP TABLE Student.",
            "DML (Data): Commands that manipulate data instances within tables. Examples: INSERT INTO Student VALUES (1, 'Aman', 17); UPDATE Student SET Age = 18 WHERE Roll = 1; DELETE FROM Student WHERE Roll = 1; SELECT * FROM Student.",
            "Auto-commit: DDL changes are permanent and auto-committed; DML can be rolled back using transactions."
          ]
        ],
        [
          "Explain SQL Aggregate Functions and their use in GROUP BY queries.",
          [
            "Aggregate Functions: SUM(), AVG(), COUNT(), MIN(), MAX() calculate a single summary value across multiple rows.",
            "GROUP BY Clause: Groups rows sharing identical values in specified columns for aggregate calculation.",
            "HAVING Clause: Restricts grouped rows meeting specified aggregate criteria (e.g. HAVING COUNT(*) > 5).",
            "Execution Order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY."
          ]
        ],
        [
          "Explain Database Normalization: 1NF, 2NF, and 3NF.",
          [
            "1NF (First Normal Form): Eliminates repeating groups; every attribute value must be atomic and indivisible.",
            "2NF (Second Normal Form): Must be in 1NF; eliminates Partial Functional Dependency (non-key attributes must depend on full primary key).",
            "3NF (Third Normal Form): Must be in 2NF; eliminates Transitive Dependency (non-key attribute cannot depend on another non-key attribute).",
            "Benefits: Eliminates data redundancy, prevents insertion, update, and deletion anomalies, and optimizes storage."
          ]
        ],
        [
          "Discuss SQL Table Joins: Inner Join, Left Outer Join, and Right Outer Join.",
          [
            "Cartesian Product (CROSS JOIN): Multiplies every row of Table A with every row of Table B.",
            "INNER JOIN: Returns rows matching join condition in both tables.",
            "LEFT OUTER JOIN: Returns all rows from left table plus matching rows from right table (nulls if no match).",
            "RIGHT OUTER JOIN: Returns all rows from right table plus matching rows from left table."
          ]
        ]
      ],
      "cs": [
        [
          "Case: Write SQL queries for a table 'Accounts' (AccNo INT, CustName VARCHAR(40), Balance DECIMAL(10,2), Branch VARCHAR(30)): (a) Display branch-wise total balance where total balance exceeds Rs 5,00,000; (b) Display customer details ordered by Balance descending.",
          [
            "Query (a):\nSELECT Branch, SUM(Balance) AS TotalBal\nFROM Accounts\nGROUP BY Branch\nHAVING SUM(Balance) > 500000;\n\nQuery (b):\nSELECT * FROM Accounts\nORDER BY Balance DESC;"
          ]
        ],
        [
          "Case: Table 'Orders' has a Foreign Key 'CustomerID' referencing 'Customers(ID)'. A user attempts to delete a customer who has 3 pending orders. What happens under default RESTRICT / CASCADE rules?",
          [
            "Under default RESTRICT / NO ACTION, the database rejects the deletion with a Foreign Key constraint violation error.",
            "Under ON DELETE CASCADE, the parent record is deleted along with all 3 dependent child orders automatically."
          ]
        ]
      ]
    },
    {
      "t": "Emerging Technologies & Digital Financial Tools",
      "k": [
        "Emerging computing paradigms: Cloud Computing (IaaS, PaaS, SaaS), Artificial Intelligence, Machine Learning, and Big Data (5 Vs).",
        "Internet of Things (IoT): Interconnected smart sensors and physical devices communicating autonomously.",
        "Blockchains: Distributed, decentralized immutable ledger technology underlying cryptocurrencies and smart contracts.",
        "Digital financial systems: UPI (Unified Payments Interface), Mobile Wallets, QR code payments, Aadhaar Enabled Payment System (AePS)."
      ],
      "mcq": [
        [
          "Which Cloud Computing service model provides on-demand virtualized computing infrastructure (servers, storage, networks)?",
          [
            "SaaS (Software as a Service)",
            "PaaS (Platform as a Service)",
            "IaaS (Infrastructure as a Service)",
            "DaaS (Desktop as a Service)"
          ],
          2,
          "IaaS (e.g. AWS EC2, Google Compute Engine) provisions virtualized compute and storage hardware."
        ],
        [
          "Which characteristic is considered the fundamental security foundation of Blockchain technology?",
          [
            "Centralized administrator control",
            "Immutability ensured through cryptographic hashing and decentralized consensus",
            "Stored on magnetic floppy disks",
            "Free from internet connections"
          ],
          1,
          "Decentralized consensus and cryptographic hashes prevent altering previous blocks in the chain."
        ],
        [
          "The 5 'V's of Big Data are Volume, Velocity, Variety, Veracity, and:",
          [
            "Validity",
            "Value",
            "Vector",
            "Volatility"
          ],
          1,
          "Big Data must be analyzed to extract actionable 'Value' from massive diverse information."
        ],
        [
          "Unified Payments Interface (UPI) was developed in India by which apex organization?",
          [
            "Reserve Bank of India alone",
            "National Payments Corporation of India (NPCI)",
            "SEBI",
            "NITI Aayog"
          ],
          1,
          "NPCI engineered UPI to facilitate instant 24/7 mobile inter-bank fund transfers."
        ],
        [
          "Aadhaar Enabled Payment System (AePS) allows bank account holders to execute financial transactions using:",
          [
            "Debit card PIN",
            "Biometric fingerprint / iris authentication and Aadhaar number",
            "Credit card CVV",
            "Physical paper cheque"
          ],
          1,
          "AePS enables micro-ATM biometric fund withdrawals without debit cards."
        ]
      ],
      "sh": [
        [
          "Distinguish between SaaS, PaaS, and IaaS in Cloud Computing.",
          [
            "IaaS: Provides raw virtual compute, storage, and networking (e.g. AWS EC2).",
            "PaaS: Provides runtime environments and tools for developers to build apps without managing OS (e.g. Heroku).",
            "SaaS: Delivers fully managed end-user software over the web (e.g. Google Docs, Salesforce)."
          ]
        ],
        [
          "What is the difference between Artificial Intelligence (AI) and Machine Learning (ML)?",
          [
            "AI is the broad field of creating systems simulating human intelligence; ML is a subset focused on learning from data without explicit programming."
          ]
        ],
        [
          "Explain the concept of 'Smart Contracts' on a blockchain.",
          [
            "Self-executing automated digital agreements where terms are written in code and triggered when conditions are verified."
          ]
        ],
        [
          "State two advantages of Unified Payments Interface (UPI) over traditional NEFT/RTGS.",
          [
            "Instant 24/7 real-time settlement without beneficiary registration delays, using simple Virtual Payment Addresses (VPAs)."
          ]
        ]
      ],
      "lg": [
        [
          "Explain Cloud Computing: deployment models, service architectures, and business advantages.",
          [
            "Deployment Models: Public Cloud (shared multi-tenant), Private Cloud (dedicated enterprise infrastructure), Hybrid Cloud (integrated mix).",
            "Service Models: IaaS (raw infrastructure), PaaS (development environment), SaaS (ready software).",
            "Business Advantages: Eliminates massive upfront capital expense (CapEx to OpEx), infinite elastic scalability, and automated redundancy."
          ]
        ],
        [
          "Discuss the architecture and security features of Blockchain Technology.",
          [
            "Distributed Ledger: Identical ledger copies maintained across thousands of independent peer nodes.",
            "Cryptographic Hash: SHA-256 algorithm links blocks; altering one block invalidates all subsequent block hashes.",
            "Consensus Mechanisms: Proof-of-Work (PoW) or Proof-of-Stake (PoS) prevents double-spending and malicious forks.",
            "Business Applications: Supply chain traceability, digital credential verification, cross-border remittances, and tamper-proof real estate registries."
          ]
        ],
        [
          "Discuss the Big Data ecosystem: The 5 Vs and its applications in modern commerce.",
          [
            "Volume: Petabytes and exabytes of structured and unstructured information generated daily.",
            "Velocity: Blazing real-time speed of streaming data from sensors, clicks, and social feeds.",
            "Variety: Diverse formats ranging from relational tables to video, audio, PDFs, and log files.",
            "Veracity: Managing data trustworthiness, noise, and bias before modeling.",
            "Value: Transforming raw datasets into predictive analytics, dynamic pricing, and targeted advertising."
          ]
        ],
        [
          "Explain the digital payments infrastructure in India (UPI, AePS, Wallets, and Central Bank Digital Currency - CBDC).",
          [
            "UPI: Instant mobile-first real-time interbank settlement platform powered by NPCI.",
            "AePS: Micro-ATMs enabling rural financial inclusion using Aadhaar biometric authentication.",
            "Mobile Wallets: Pre-funded semi-closed PPIs for micro-transactions.",
            "Digital Rupee (e-Rupee CBDC): RBI-issued sovereign digital currency utilizing blockchain token principles to reduce physical cash handling."
          ]
        ]
      ],
      "cs": [
        [
          "Case: An accounting startup wants to deploy its billing software without purchasing expensive physical servers, cooling infrastructure, or hiring maintenance technicians. Recommend a cloud model and justify.",
          [
            "Recommend: Cloud SaaS or PaaS on Public Cloud (e.g. AWS or Azure).",
            "Allows the startup to pay purely for consumed resources on an operational subscription basis (OpEx).",
            "Provides automated scalability during peak tax filing seasons without physical hardware bottlenecks."
          ]
        ],
        [
          "Case: A retail supply chain suffers from counterfeit luxury goods entering its distribution pipeline. Explain how Blockchain technology can solve this problem.",
          [
            "Deploy a permissioned blockchain where every step — manufacturing, customs, warehouse, and store dispatch — is logged as an immutable signed block.",
            "End consumers scan a QR code on the luxury handbag to view its authentic verifiable digital ledger history, preventing counterfeit entry."
          ]
        ]
      ]
    }
  ]
};
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
