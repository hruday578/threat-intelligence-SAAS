// ─── NewsAPI.ai Concept URIs ───────────────────────────────────────────────────
// Any Wikipedia page is a valid concept in NewsAPI.ai / EventRegistry.
// Concepts match ALL articles semantically tagged with that Wikipedia topic —
// broader than keywords. e.g. "Natural Disaster" → wildfire, flood, earthquake…
//
// Organized into groups for the grouped dropdown UI.

export const CONCEPT_GROUPS = [

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🌪️ Disasters & Hazards',
    concepts: [
      { label: 'Natural Disaster',        uri: 'http://en.wikipedia.org/wiki/Natural_disaster' },
      { label: 'Earthquake',              uri: 'http://en.wikipedia.org/wiki/Earthquake' },
      { label: 'Tsunami',                 uri: 'http://en.wikipedia.org/wiki/Tsunami' },
      { label: 'Tropical Cyclone',        uri: 'http://en.wikipedia.org/wiki/Tropical_cyclone' },
      { label: 'Hurricane',               uri: 'http://en.wikipedia.org/wiki/Hurricane' },
      { label: 'Tornado',                 uri: 'http://en.wikipedia.org/wiki/Tornado' },
      { label: 'Wildfire',                uri: 'http://en.wikipedia.org/wiki/Wildfire' },
      { label: 'Flood',                   uri: 'http://en.wikipedia.org/wiki/Flood' },
      { label: 'Flash Flood',             uri: 'http://en.wikipedia.org/wiki/Flash_flood' },
      { label: 'Landslide',               uri: 'http://en.wikipedia.org/wiki/Landslide' },
      { label: 'Volcanic Eruption',       uri: 'http://en.wikipedia.org/wiki/Volcanic_eruption' },
      { label: 'Avalanche',               uri: 'http://en.wikipedia.org/wiki/Avalanche' },
      { label: 'Drought',                 uri: 'http://en.wikipedia.org/wiki/Drought' },
      { label: 'Heat Wave',               uri: 'http://en.wikipedia.org/wiki/Heat_wave' },
      { label: 'Blizzard',                uri: 'http://en.wikipedia.org/wiki/Blizzard' },
      { label: 'Dust Storm',              uri: 'http://en.wikipedia.org/wiki/Dust_storm' },
      { label: 'Sinkhole',                uri: 'http://en.wikipedia.org/wiki/Sinkhole' },
      { label: 'Explosion',               uri: 'http://en.wikipedia.org/wiki/Explosion' },
      { label: 'Industrial Accident',     uri: 'http://en.wikipedia.org/wiki/Industrial_accident' },
      { label: 'Nuclear Accident',        uri: 'http://en.wikipedia.org/wiki/Nuclear_and_radiation_accidents_and_incidents' },
      { label: 'Chemical Spill',          uri: 'http://en.wikipedia.org/wiki/Chemical_spill' },
      { label: 'Building Collapse',       uri: 'http://en.wikipedia.org/wiki/Building_collapse' },
      { label: 'Mine Accident',           uri: 'http://en.wikipedia.org/wiki/Mining_accident' },
      { label: 'Gas Leak',                uri: 'http://en.wikipedia.org/wiki/Gas_leak' },
      { label: 'Shipwreck',               uri: 'http://en.wikipedia.org/wiki/Shipwreck' },
      { label: 'Train Accident',          uri: 'http://en.wikipedia.org/wiki/Train_wreck' },
      { label: 'Aviation Accident',       uri: 'http://en.wikipedia.org/wiki/Aviation_accidents_and_incidents' },
      { label: 'Traffic Collision',       uri: 'http://en.wikipedia.org/wiki/Traffic_collision' },
      { label: 'Power Outage',            uri: 'http://en.wikipedia.org/wiki/Power_outage' },
      { label: 'Disaster Management',     uri: 'http://en.wikipedia.org/wiki/Disaster_management' },
      { label: 'Emergency Management',    uri: 'http://en.wikipedia.org/wiki/Emergency_management' },
      { label: 'Search and Rescue',       uri: 'http://en.wikipedia.org/wiki/Search_and_rescue' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '⚔️ Conflict & Security',
    concepts: [
      { label: 'War',                     uri: 'http://en.wikipedia.org/wiki/War' },
      { label: 'Armed Conflict',          uri: 'http://en.wikipedia.org/wiki/Armed_conflict' },
      { label: 'Civil War',               uri: 'http://en.wikipedia.org/wiki/Civil_war' },
      { label: 'Terrorism',               uri: 'http://en.wikipedia.org/wiki/Terrorism' },
      { label: 'Terrorist Attack',        uri: 'http://en.wikipedia.org/wiki/Terrorist_attack' },
      { label: 'Insurgency',              uri: 'http://en.wikipedia.org/wiki/Insurgency' },
      { label: 'Genocide',                uri: 'http://en.wikipedia.org/wiki/Genocide' },
      { label: 'Civil Unrest',            uri: 'http://en.wikipedia.org/wiki/Civil_unrest' },
      { label: 'Riot',                    uri: 'http://en.wikipedia.org/wiki/Riot' },
      { label: 'Protest',                 uri: 'http://en.wikipedia.org/wiki/Protest' },
      { label: 'Coup d\'état',            uri: 'http://en.wikipedia.org/wiki/Coup_d%27%C3%A9tat' },
      { label: 'Military Operation',      uri: 'http://en.wikipedia.org/wiki/Military_operation' },
      { label: 'Airstrike',               uri: 'http://en.wikipedia.org/wiki/Airstrike' },
      { label: 'Siege',                   uri: 'http://en.wikipedia.org/wiki/Siege' },
      { label: 'Hostage',                 uri: 'http://en.wikipedia.org/wiki/Hostage' },
      { label: 'Assassination',           uri: 'http://en.wikipedia.org/wiki/Assassination' },
      { label: 'Kidnapping',              uri: 'http://en.wikipedia.org/wiki/Kidnapping' },
      { label: 'Drone Strike',            uri: 'http://en.wikipedia.org/wiki/Drone_strike' },
      { label: 'Nuclear Weapon',          uri: 'http://en.wikipedia.org/wiki/Nuclear_weapon' },
      { label: 'Biological Warfare',      uri: 'http://en.wikipedia.org/wiki/Biological_warfare' },
      { label: 'Sanctions',               uri: 'http://en.wikipedia.org/wiki/Economic_sanctions' },
      { label: 'Peacekeeping',            uri: 'http://en.wikipedia.org/wiki/Peacekeeping' },
      { label: 'Ceasefire',               uri: 'http://en.wikipedia.org/wiki/Ceasefire' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🖥️ Cyber & Technology',
    concepts: [
      { label: 'Cyberattack',             uri: 'http://en.wikipedia.org/wiki/Cyberattack' },
      { label: 'Cybercrime',              uri: 'http://en.wikipedia.org/wiki/Cybercrime' },
      { label: 'Data Breach',             uri: 'http://en.wikipedia.org/wiki/Data_breach' },
      { label: 'Ransomware',              uri: 'http://en.wikipedia.org/wiki/Ransomware' },
      { label: 'Malware',                 uri: 'http://en.wikipedia.org/wiki/Malware' },
      { label: 'Phishing',                uri: 'http://en.wikipedia.org/wiki/Phishing' },
      { label: 'Hacker',                  uri: 'http://en.wikipedia.org/wiki/Hacker' },
      { label: 'Cybersecurity',           uri: 'http://en.wikipedia.org/wiki/Computer_security' },
      { label: 'Artificial Intelligence', uri: 'http://en.wikipedia.org/wiki/Artificial_intelligence' },
      { label: 'Machine Learning',        uri: 'http://en.wikipedia.org/wiki/Machine_learning' },
      { label: 'Large Language Model',    uri: 'http://en.wikipedia.org/wiki/Large_language_model' },
      { label: 'Robotics',                uri: 'http://en.wikipedia.org/wiki/Robotics' },
      { label: 'Autonomous Vehicle',      uri: 'http://en.wikipedia.org/wiki/Autonomous_vehicle' },
      { label: 'Semiconductor',           uri: 'http://en.wikipedia.org/wiki/Semiconductor' },
      { label: 'Internet',                uri: 'http://en.wikipedia.org/wiki/Internet' },
      { label: 'Social Media',            uri: 'http://en.wikipedia.org/wiki/Social_media' },
      { label: 'Disinformation',          uri: 'http://en.wikipedia.org/wiki/Disinformation' },
      { label: 'Blockchain',              uri: 'http://en.wikipedia.org/wiki/Blockchain' },
      { label: 'Cryptocurrency',          uri: 'http://en.wikipedia.org/wiki/Cryptocurrency' },
      { label: 'Quantum Computing',       uri: 'http://en.wikipedia.org/wiki/Quantum_computing' },
      { label: '5G Network',              uri: 'http://en.wikipedia.org/wiki/5G' },
      { label: 'Surveillance',            uri: 'http://en.wikipedia.org/wiki/Surveillance' },
      { label: 'Privacy',                 uri: 'http://en.wikipedia.org/wiki/Privacy' },
      { label: 'Big Data',                uri: 'http://en.wikipedia.org/wiki/Big_data' },
      { label: 'Space Technology',        uri: 'http://en.wikipedia.org/wiki/Space_technology' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🏥 Public Health & Medicine',
    concepts: [
      { label: 'Pandemic',                uri: 'http://en.wikipedia.org/wiki/Pandemic' },
      { label: 'Epidemic',                uri: 'http://en.wikipedia.org/wiki/Epidemic' },
      { label: 'Outbreak',                uri: 'http://en.wikipedia.org/wiki/Outbreak' },
      { label: 'Biological Hazard',       uri: 'http://en.wikipedia.org/wiki/Biological_hazard' },
      { label: 'Infectious Disease',      uri: 'http://en.wikipedia.org/wiki/Infectious_disease' },
      { label: 'Vaccine',                 uri: 'http://en.wikipedia.org/wiki/Vaccine' },
      { label: 'COVID-19',                uri: 'http://en.wikipedia.org/wiki/COVID-19' },
      { label: 'Ebola',                   uri: 'http://en.wikipedia.org/wiki/Ebola_virus_disease' },
      { label: 'Monkeypox',               uri: 'http://en.wikipedia.org/wiki/Mpox' },
      { label: 'Tuberculosis',            uri: 'http://en.wikipedia.org/wiki/Tuberculosis' },
      { label: 'Cholera',                 uri: 'http://en.wikipedia.org/wiki/Cholera' },
      { label: 'Mental Health',           uri: 'http://en.wikipedia.org/wiki/Mental_health' },
      { label: 'Drug Overdose',           uri: 'http://en.wikipedia.org/wiki/Drug_overdose' },
      { label: 'Cancer',                  uri: 'http://en.wikipedia.org/wiki/Cancer' },
      { label: 'Healthcare',              uri: 'http://en.wikipedia.org/wiki/Health_care' },
      { label: 'World Health Organization', uri: 'http://en.wikipedia.org/wiki/World_Health_Organization' },
      { label: 'Food Safety',             uri: 'http://en.wikipedia.org/wiki/Food_safety' },
      { label: 'Famine',                  uri: 'http://en.wikipedia.org/wiki/Famine' },
      { label: 'Medical Research',        uri: 'http://en.wikipedia.org/wiki/Medical_research' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🌿 Environment & Climate',
    concepts: [
      { label: 'Climate Change',          uri: 'http://en.wikipedia.org/wiki/Climate_change' },
      { label: 'Global Warming',          uri: 'http://en.wikipedia.org/wiki/Global_warming' },
      { label: 'Air Pollution',           uri: 'http://en.wikipedia.org/wiki/Air_pollution' },
      { label: 'Water Pollution',         uri: 'http://en.wikipedia.org/wiki/Water_pollution' },
      { label: 'Oil Spill',               uri: 'http://en.wikipedia.org/wiki/Oil_spill' },
      { label: 'Deforestation',           uri: 'http://en.wikipedia.org/wiki/Deforestation' },
      { label: 'Biodiversity Loss',       uri: 'http://en.wikipedia.org/wiki/Biodiversity_loss' },
      { label: 'Coral Bleaching',         uri: 'http://en.wikipedia.org/wiki/Coral_bleaching' },
      { label: 'Plastic Pollution',       uri: 'http://en.wikipedia.org/wiki/Plastic_pollution' },
      { label: 'Carbon Emission',         uri: 'http://en.wikipedia.org/wiki/Carbon_dioxide_in_Earth%27s_atmosphere' },
      { label: 'Renewable Energy',        uri: 'http://en.wikipedia.org/wiki/Renewable_energy' },
      { label: 'Solar Energy',            uri: 'http://en.wikipedia.org/wiki/Solar_energy' },
      { label: 'Wind Power',              uri: 'http://en.wikipedia.org/wiki/Wind_power' },
      { label: 'Electric Vehicle',        uri: 'http://en.wikipedia.org/wiki/Electric_vehicle' },
      { label: 'Arctic Ice',              uri: 'http://en.wikipedia.org/wiki/Arctic_ice_pack' },
      { label: 'Sea Level Rise',          uri: 'http://en.wikipedia.org/wiki/Sea_level_rise' },
      { label: 'Environmental Protection', uri: 'http://en.wikipedia.org/wiki/Environmental_protection' },
      { label: 'Endangered Species',      uri: 'http://en.wikipedia.org/wiki/Endangered_species' },
      { label: 'Nuclear Energy',          uri: 'http://en.wikipedia.org/wiki/Nuclear_power' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🏛️ Politics & Governance',
    concepts: [
      { label: 'Election',                uri: 'http://en.wikipedia.org/wiki/Election' },
      { label: 'Democracy',               uri: 'http://en.wikipedia.org/wiki/Democracy' },
      { label: 'Authoritarianism',        uri: 'http://en.wikipedia.org/wiki/Authoritarianism' },
      { label: 'Government',              uri: 'http://en.wikipedia.org/wiki/Government' },
      { label: 'Parliament',              uri: 'http://en.wikipedia.org/wiki/Parliament' },
      { label: 'United Nations',          uri: 'http://en.wikipedia.org/wiki/United_Nations' },
      { label: 'NATO',                    uri: 'http://en.wikipedia.org/wiki/NATO' },
      { label: 'Geopolitics',             uri: 'http://en.wikipedia.org/wiki/Geopolitics' },
      { label: 'Diplomacy',               uri: 'http://en.wikipedia.org/wiki/Diplomacy' },
      { label: 'Foreign Policy',          uri: 'http://en.wikipedia.org/wiki/Foreign_policy' },
      { label: 'International Relations', uri: 'http://en.wikipedia.org/wiki/International_relations' },
      { label: 'Human Rights',            uri: 'http://en.wikipedia.org/wiki/Human_rights' },
      { label: 'Refugee',                 uri: 'http://en.wikipedia.org/wiki/Refugee' },
      { label: 'Immigration',             uri: 'http://en.wikipedia.org/wiki/Immigration' },
      { label: 'Corruption',              uri: 'http://en.wikipedia.org/wiki/Political_corruption' },
      { label: 'Impeachment',             uri: 'http://en.wikipedia.org/wiki/Impeachment' },
      { label: 'Censorship',              uri: 'http://en.wikipedia.org/wiki/Censorship' },
      { label: 'Freedom of Press',        uri: 'http://en.wikipedia.org/wiki/Freedom_of_the_press' },
      { label: 'Propaganda',              uri: 'http://en.wikipedia.org/wiki/Propaganda' },
      { label: 'Espionage',               uri: 'http://en.wikipedia.org/wiki/Espionage' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '💰 Business & Economy',
    concepts: [
      { label: 'Financial Crisis',        uri: 'http://en.wikipedia.org/wiki/Financial_crisis' },
      { label: 'Recession',               uri: 'http://en.wikipedia.org/wiki/Recession' },
      { label: 'Inflation',               uri: 'http://en.wikipedia.org/wiki/Inflation' },
      { label: 'Stock Market',            uri: 'http://en.wikipedia.org/wiki/Stock_market' },
      { label: 'Bankruptcy',              uri: 'http://en.wikipedia.org/wiki/Bankruptcy' },
      { label: 'Merger and Acquisition',  uri: 'http://en.wikipedia.org/wiki/Mergers_and_acquisitions' },
      { label: 'Supply Chain',            uri: 'http://en.wikipedia.org/wiki/Supply_chain' },
      { label: 'Trade War',               uri: 'http://en.wikipedia.org/wiki/Trade_war' },
      { label: 'Tariff',                  uri: 'http://en.wikipedia.org/wiki/Tariff' },
      { label: 'Unemployment',            uri: 'http://en.wikipedia.org/wiki/Unemployment' },
      { label: 'Startup',                 uri: 'http://en.wikipedia.org/wiki/Startup_company' },
      { label: 'Investment',              uri: 'http://en.wikipedia.org/wiki/Investment' },
      { label: 'Oil Price',               uri: 'http://en.wikipedia.org/wiki/Oil_price' },
      { label: 'Energy Crisis',           uri: 'http://en.wikipedia.org/wiki/Energy_crisis' },
      { label: 'Food Crisis',             uri: 'http://en.wikipedia.org/wiki/Food_security' },
      { label: 'Money Laundering',        uri: 'http://en.wikipedia.org/wiki/Money_laundering' },
      { label: 'Tax',                     uri: 'http://en.wikipedia.org/wiki/Tax' },
      { label: 'Labor Strike',            uri: 'http://en.wikipedia.org/wiki/Strike_action' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '⚖️ Crime & Justice',
    concepts: [
      { label: 'Crime',                   uri: 'http://en.wikipedia.org/wiki/Crime' },
      { label: 'Murder',                  uri: 'http://en.wikipedia.org/wiki/Murder' },
      { label: 'Mass Shooting',           uri: 'http://en.wikipedia.org/wiki/Mass_shooting' },
      { label: 'Shooting',                uri: 'http://en.wikipedia.org/wiki/Shooting' },
      { label: 'Fraud',                   uri: 'http://en.wikipedia.org/wiki/Fraud' },
      { label: 'Drug Trafficking',        uri: 'http://en.wikipedia.org/wiki/Drug_trafficking' },
      { label: 'Human Trafficking',       uri: 'http://en.wikipedia.org/wiki/Human_trafficking' },
      { label: 'Gang',                    uri: 'http://en.wikipedia.org/wiki/Gang' },
      { label: 'Police Brutality',        uri: 'http://en.wikipedia.org/wiki/Police_brutality' },
      { label: 'Prison',                  uri: 'http://en.wikipedia.org/wiki/Prison' },
      { label: 'Trial',                   uri: 'http://en.wikipedia.org/wiki/Trial' },
      { label: 'Lawsuit',                 uri: 'http://en.wikipedia.org/wiki/Lawsuit' },
      { label: 'Domestic Violence',       uri: 'http://en.wikipedia.org/wiki/Domestic_violence' },
      { label: 'Organized Crime',         uri: 'http://en.wikipedia.org/wiki/Organized_crime' },
      { label: 'Piracy',                  uri: 'http://en.wikipedia.org/wiki/Piracy' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🔬 Science & Space',
    concepts: [
      { label: 'Space Exploration',       uri: 'http://en.wikipedia.org/wiki/Space_exploration' },
      { label: 'NASA',                    uri: 'http://en.wikipedia.org/wiki/NASA' },
      { label: 'SpaceX',                  uri: 'http://en.wikipedia.org/wiki/SpaceX' },
      { label: 'Asteroid',                uri: 'http://en.wikipedia.org/wiki/Asteroid' },
      { label: 'Solar Storm',             uri: 'http://en.wikipedia.org/wiki/Solar_storm' },
      { label: 'Satellite',               uri: 'http://en.wikipedia.org/wiki/Satellite' },
      { label: 'Scientific Discovery',    uri: 'http://en.wikipedia.org/wiki/Scientific_discovery' },
      { label: 'Genetics',                uri: 'http://en.wikipedia.org/wiki/Genetics' },
      { label: 'Climate Science',         uri: 'http://en.wikipedia.org/wiki/Climatology' },
      { label: 'Nuclear Fusion',          uri: 'http://en.wikipedia.org/wiki/Nuclear_fusion' },
      { label: 'Biotechnology',           uri: 'http://en.wikipedia.org/wiki/Biotechnology' },
      { label: 'Gene Editing',            uri: 'http://en.wikipedia.org/wiki/Gene_editing' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '🚨 Infrastructure & Transport',
    concepts: [
      { label: 'Infrastructure',          uri: 'http://en.wikipedia.org/wiki/Infrastructure' },
      { label: 'Bridge Collapse',         uri: 'http://en.wikipedia.org/wiki/Bridge_failure' },
      { label: 'Dam Failure',             uri: 'http://en.wikipedia.org/wiki/Dam_failure' },
      { label: 'Pipeline',                uri: 'http://en.wikipedia.org/wiki/Pipeline_transport' },
      { label: 'Airport',                 uri: 'http://en.wikipedia.org/wiki/Airport' },
      { label: 'Shipping',                uri: 'http://en.wikipedia.org/wiki/Shipping' },
      { label: 'Port',                    uri: 'http://en.wikipedia.org/wiki/Port' },
      { label: 'Railway',                 uri: 'http://en.wikipedia.org/wiki/Rail_transport' },
      { label: 'Highway',                 uri: 'http://en.wikipedia.org/wiki/Highway' },
      { label: 'Urban Flooding',          uri: 'http://en.wikipedia.org/wiki/Urban_flooding' },
      { label: 'Water Supply',            uri: 'http://en.wikipedia.org/wiki/Water_supply' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '👥 Society & Human Interest',
    concepts: [
      { label: 'Poverty',                 uri: 'http://en.wikipedia.org/wiki/Poverty' },
      { label: 'Hunger',                  uri: 'http://en.wikipedia.org/wiki/Hunger' },
      { label: 'Humanitarian Crisis',     uri: 'http://en.wikipedia.org/wiki/Humanitarian_crisis' },
      { label: 'Displaced Person',        uri: 'http://en.wikipedia.org/wiki/Internally_displaced_person' },
      { label: 'Education',               uri: 'http://en.wikipedia.org/wiki/Education' },
      { label: 'Child Labor',             uri: 'http://en.wikipedia.org/wiki/Child_labour' },
      { label: 'Racism',                  uri: 'http://en.wikipedia.org/wiki/Racism' },
      { label: 'Discrimination',          uri: 'http://en.wikipedia.org/wiki/Discrimination' },
      { label: 'Gender Equality',         uri: 'http://en.wikipedia.org/wiki/Gender_equality' },
      { label: 'Social Movement',         uri: 'http://en.wikipedia.org/wiki/Social_movement' },
      { label: 'Religion',                uri: 'http://en.wikipedia.org/wiki/Religion' },
      { label: 'Cultural Heritage',       uri: 'http://en.wikipedia.org/wiki/Cultural_heritage' },
    ]
  },

  // ════════════════════════════════════════════════════════════════════════════
  {
    group: '⚽ Sports',
    concepts: [
      { label: 'Football (Soccer)',        uri: 'http://en.wikipedia.org/wiki/Association_football' },
      { label: 'Cricket',                  uri: 'http://en.wikipedia.org/wiki/Cricket' },
      { label: 'Olympics',                 uri: 'http://en.wikipedia.org/wiki/Olympic_Games' },
      { label: 'FIFA World Cup',           uri: 'http://en.wikipedia.org/wiki/FIFA_World_Cup' },
      { label: 'Basketball',               uri: 'http://en.wikipedia.org/wiki/Basketball' },
      { label: 'Tennis',                   uri: 'http://en.wikipedia.org/wiki/Tennis' },
      { label: 'Formula One',              uri: 'http://en.wikipedia.org/wiki/Formula_One' },
      { label: 'Doping in Sport',          uri: 'http://en.wikipedia.org/wiki/Doping_in_sport' },
      { label: 'Match Fixing',             uri: 'http://en.wikipedia.org/wiki/Match_fixing' },
    ]
  },
];

// ─── Flat list (backwards-compatible with ConceptInput autocomplete) ──────────
export const CURATED_CONCEPTS = CONCEPT_GROUPS.flatMap(g =>
  g.concepts.map(c => ({ ...c, group: g.group }))
);
