export const baselineDefaults = {
  // Cane Handling
  cane_feed_rate_tph: 220.0,
  trash_pct: 3.5,
  cane_pol_pct: 18.2,
  cane_brix_pct: 20.5,
  // Milling
  imbibition_water_pct: 25.0,
  mill_speed_rpm: 4.2,
  bagasse_moisture_pct: 50.5,
  // Clarification
  lime_dosage_kg_tc: 0.85,
  clarification_temp_c: 102.0,
  // Evaporation
  steam_flow_tph: 42.0,
  steam_economy: 3.4,
  // Crystallization
  supersaturation_coeff: 1.15,
  vacuum_pressure_mbar: 68.0,
  // Centrifugation
  centrifuge_speed_rpm: 1080.0,
  wash_water_m3_hr: 0.8
};

export const inputStructure = [
  {
    stage: 'cane_handling',
    label: 'Cane Handling Quality & Feed',
    icon: '🌾',
    color: 'var(--green)',
    params: [
      { key: 'cane_feed_rate_tph', label: 'Conveyor Feed Rate', min: 100, max: 300, step: 5, unit: 'T/H', desc: 'Raw sugarcane tonnage entering the plant.' },
      { key: 'trash_pct', label: 'Cane Trash Impurity', min: 0.5, max: 10.0, step: 0.1, unit: '%', desc: 'Sugarcane soil and plant matter impurities before shredding.' },
      { key: 'cane_pol_pct', label: 'Sucrose (Pol) Content', min: 10.0, max: 22.0, step: 0.1, unit: '%', desc: 'Percentage of pure sucrose in the cane stalk.' },
      { key: 'cane_brix_pct', label: 'Soluble Solids (Brix)', min: 12.0, max: 25.0, step: 0.1, unit: '%', desc: 'Total dissolved solids (sugar + non-sugar) in the cane juice.' }
    ]
  },
  {
    stage: 'milling',
    label: 'Milling Extraction Train',
    icon: '⚙️',
    color: 'var(--cyan)',
    params: [
      { key: 'imbibition_water_pct', label: 'Imbibition Water Ratio', min: 15.0, max: 40.0, step: 0.5, unit: '%', desc: 'Dilution water spray. High rates wash sucrose but burden evaporators.' },
      { key: 'mill_speed_rpm', label: 'Roller RPM Speed', min: 2.0, max: 8.0, step: 0.1, unit: 'RPM', desc: 'Crushing mill roll velocity. Directly impacts throughput pressure.' },
      { key: 'bagasse_moisture_pct', label: 'Bagasse Moisture Spec', min: 40.0, max: 60.0, step: 0.5, unit: '%', desc: 'Moisture left in discarded fibers. High pressure lowers moisture.' }
    ]
  },
  {
    stage: 'clarification',
    label: 'Clarification Defecation',
    icon: '🧪',
    color: 'var(--purple)',
    params: [
      { key: 'lime_dosage_kg_tc', label: 'Lime Milk Dosing', min: 0.4, max: 1.6, step: 0.02, unit: 'kg/TC', desc: 'Calcium hydroxide chemical dosing. Aiming for 7.2 pH neutrality.' },
      { key: 'clarification_temp_c', label: 'Juice Heating Temp', min: 85.0, max: 115.0, step: 0.5, unit: '°C', desc: 'Defecation flash heater process temperature target.' }
    ]
  },
  {
    stage: 'evaporation',
    label: 'Evaporator Train',
    icon: '💨',
    color: 'var(--amber)',
    params: [
      { key: 'steam_flow_tph', label: 'Heating Steam Flow', min: 20.0, max: 60.0, step: 0.5, unit: 'T/H', desc: 'Live boiler steam feed rate entering the quintuple effect.' },
      { key: 'steam_economy', label: 'Evaporation Economy', min: 2.5, max: 4.5, step: 0.1, unit: 'ratio', desc: 'Calibrated evaporation efficiency (evaporated water / steam flow).' }
    ]
  },
  {
    stage: 'crystallization',
    label: 'Vacuum Crystallization Pans',
    icon: '💎',
    color: 'var(--cyan)',
    params: [
      { key: 'supersaturation_coeff', label: 'Target Supersaturation', min: 0.90, max: 1.40, step: 0.01, unit: 'coeff', desc: 'Concentration target. High levels prompt spontaneous grain defects.' },
      { key: 'vacuum_pressure_mbar', label: 'Pan Condenser Vacuum', min: 40.0, max: 100.0, step: 1, unit: 'mbar', desc: 'Vacuum draft. Higher vacuum drops boiling temperature of molasses.' }
    ]
  },
  {
    stage: 'centrifugation',
    label: 'Centrifugal Separators',
    icon: '🔄',
    color: 'var(--red)',
    params: [
      { key: 'centrifuge_speed_rpm', label: 'Centrifuge Rotor Speed', min: 800.0, max: 1400.0, step: 10, unit: 'RPM', desc: 'G-force spinning speed. Elevates crystal purging efficiency.' },
      { key: 'wash_water_m3_hr', label: 'Purging Wash Water', min: 0.2, max: 2.0, step: 0.1, unit: 'm³/H', desc: 'Water spray volume inside centrifugal baskets to wash crystals.' }
    ]
  }
];

export const parameterCalculations = {
  // Cane Handling
  cane_feed_rate_tph: "Manual control room setpoint for raw conveyor input.",
  trash_pct: "Physical cane quality sensor. Trash reduces clean cane feed:\nNet Cane TPH = Conveyor Feed Rate * (1 - Trash% / 100)",
  cane_pol_pct: "Sucrose concentration of clean sugarcane. Determines total entering sucrose:\nSucrose TPH = Net Cane TPH * (Sucrose Pol% / 100)",
  cane_brix_pct: "Soluble solids concentration of sugarcane. Used to calculate raw juice purity:\nCane Purity% = (Sucrose Pol% / Soluble Solids Brix%) * 100",
  
  // Milling
  imbibition_water_pct: "Manual setpoint for juice extraction spray. Determines water flow:\nImbibition TPH = Net Cane TPH * (Imbibition Ratio / 100)",
  mill_speed_rpm: "Roller rotational speed. Scaled (RPM * 21.42) for ML model pressure, or used in speed factor fallback:\nSpeed Factor = 1 - |Speed - 4.2| * 0.08",
  bagasse_moisture_pct: "Physical compression moisture spec. Determines wet bagasse flow rate:\nWet Bagasse TPH = Dry Bagasse / (1 - Moisture% / 100)",
  
  // Clarification
  lime_dosage_kg_tc: "Calcium hydroxide chemical feed rate. Drives defecation pH:\npH = 6.0 + Lime Dosage * 1.5 (Bounded between 5.5 - 9.0)",
  clarification_temp_c: "Juice temperature target in heater. High temperature combined with pH deviations affects sugar recovery and turbidity:\npH Loss = |7.2 - pH| * 0.6\nTemp Loss = |102 - Temp| * 0.04\nTurbidity Reduction = 96.0 - pH Loss * 15 - Temp Loss * 10 (min 50.0%)",
  
  // Evaporation
  steam_flow_tph: "Boiler heating steam feed flow. Evaporates water to concentrate juice:\nEvaporated Water TPH = Steam Flow * Steam Economy (capped at 85% of juice input)",
  steam_economy: "Thermal efficiency ratio of the quintuple effect evaporator train:\nSteam Economy = Evaporated Water TPH / Steam Flow TPH",
  
  // Crystallization
  supersaturation_coeff: "Crystallization pan supersaturation target. Determines massecuite thickness (Brix):\nMassecuite Brix = 88.0 + (Supersaturation - 1.0) * 12.0",
  vacuum_pressure_mbar: "Condenser vacuum pressure in millibars. Controls boiling temp by thermodynamic balance:\nBoiling Temp = 100.0 - log10(1013 / Vacuum Pressure mbar) * 26.0 (Bounded 50.0 - 85.0 °C)",
  
  // Centrifugation
  centrifuge_speed_rpm: "Centrifuge rotor spin speed. Calculates G-force to separate crystals from molasses:\nG-Force = (RPM / 60)^2 * 0.45 * 2 * pi^2 / 9.81",
  wash_water_m3_hr: "Crystal wash water volume. Controls final product purity:\nSugar Purity% = 99.2 + Wash Water * 0.3 (capped at 99.98%)",

  // Calculated Outputs
  net_cane_tph: "Net clean cane crushed:\nNet Cane TPH = Conveyor Feed Rate * (1 - Trash% / 100)",
  fibre_tph: "Insoluble fiber flow rate:\nFiber TPH = Net Clean Cane Crushed * 12.5% (average fiber content)",
  sucrose_tph: "Mass flow of pure sucrose entering the refinery:\nSucrose TPH = Net Clean Cane Crushed * (Sucrose Pol% / 100)",
  cane_purity_pct: "Initial raw juice purity:\nCane Purity% = (Sucrose Pol% / Soluble Solids Brix%) * 100",
  
  juice_tph: "Total juice flow extracted from milling:\nJuice TPH = Net Clean Cane * (Milling Extraction% / 100) + Imbibition Water TPH",
  imbibition_tph: "Tonnage flow rate of imbibition wash water:\nImbibition TPH = Net Clean Cane * (Imbibition Water Ratio / 100)",
  mill_extraction_pct: "Sucrose extraction efficiency. Predicted using XGBoost Machine Learning model if available, otherwise falls back to physical speed equation:\nExtraction% = 93.0 + (Imbibition Ratio - 20.0) * 0.25 * (1 - |RPM - 4.2| * 0.08)",
  juice_brix_pct: "Dissolved solids concentration of raw juice:\nBrix% = 16.5 - (Imbibition Ratio - 20.0) * 0.14",
  juice_pol_pct: "Sucrose concentration of raw juice:\nPol% = Brix% * 88% (typical purity coefficient)",
  bagasse_wet_tph: "Discharged wet bagasse bypass waste flow:\nWet Bagasse TPH = Dry Bagasse / (1 - Moisture% / 100) (where Dry Bagasse = Net Clean Cane * 12.5%)",
  
  clarified_juice_tph: "Juice flow exiting clarifier after settling mud:\nClarified Juice TPH = Juice Input - Mud TPH (where Mud TPH = Juice Input * 8.0%)",
  mud_tph: "Settled mud waste flow:\nMud TPH = Raw Juice Input * 8.0%",
  estimated_ph: "Defecation pH driven by Lime Milk buffer equation:\npH = 6.0 + Lime Dosage * 1.5 (Bounded: 5.5 to 9.0)",
  clarified_purity_pct: "Purity after chemical defecation:\nClarified Purity% = Raw Purity% + Purity Uplift\nPurity Uplift = 1.8 - |7.2 - pH| * 0.6 - |102.0 - Heater Temp| * 0.04 (min 0.2%)",
  turbidity_reduction_pct: "Dirt settling effectiveness:\nTurbidity Reduction% = 96.0 - |7.2 - pH| * 9 - |102.0 - Heater Temp| * 6 (min 50.0%)",
  
  syrup_out_tph: "Syrup flow exiting evaporator:\nSyrup TPH = Juice Input - Water Evaporated TPH",
  juice_brix_out_pct: "Syrup Brix concentration (Mass balance):\nSyrup Brix% = Juice Brix In * (Juice Flow In / Syrup Flow Out) (capped at 45.0% - 78.0%)",
  water_evaporated_tph: "Water evaporated across quintuple-effects:\nWater Evaporated TPH = Steam Flow * Steam Economy (capped at 85% of juice input)",
  actual_steam_needed_tph: "Actual steam flow required for current evaporation rate:\nSteam needed = Water Evaporated / Steam Economy",
  
  massecuite_brix_pct: "Thick sugar crystal-molasses slurry Brix concentration:\nMassecuite Brix% = 88.0 + (Supersaturation - 1.0) * 12.0",
  pan_temp_c: "Boiling temperature at current vacuum pressure:\nBoiling Temp = 100.0 - log10(1013 / Vacuum Pressure mbar) * 26.0 (Bounded: 50.0 - 85.0 °C)",
  crystal_yield_pct: "Ratio of dissolved sucrose converted into solid crystals (Doring formula):\nCrystal Yield% = (Syrup Brix - 55.0) * 1.5 + (Supersaturation - 1.0) * 35.0 (Bounded: 30.0 - 55.0%)",
  crystal_tph: "Mass flow of pure crystals in massecuite slurry:\nCrystal TPH = Total Solids * (Crystal Yield% / 100)",
  molasses_tph: "Mass flow of mother liquor molasses in slurry:\nMolasses TPH = Total Solids - Crystal TPH",
  massecuite_tph: "Total massecuite slurry flow rate:\nMassecuite TPH = Crystal TPH + Molasses TPH",
  
  sugar_tph: "Dry sugar production rate (Grade A crystals):\nSugar TPH = Massecuite Input * 50% * (Centrifugation Efficiency% / 100)",
  molasses_tph_out: "Separated molasses waste flow:\nMolasses Output TPH = Massecuite Input - Sugar Output TPH",
  g_factor: "Centrifuge G-Force separating crystals from syrup:\nG-Force = (RPM / 60)^2 * 0.45 * 2 * pi^2 / 9.81",
  separation_efficiency_pct: "Purge separation efficiency based on G-Force:\nSeparation Efficiency% = 88.0 + (G-Force - 400.0) * 0.015 (Bounded: 85.0 - 99.2%)",
  final_sugar_purity_pct: "Final crystal polarimetric purity:\nPurity% = 99.2 + Wash Water * 0.3 (capped at 99.98%)",
  
  // KPIs
  overall_recovery: "Percentage of sugar recovered from entering sucrose:\nOverall Recovery% = (Sugar Output TPH / Entering Sucrose TPH) * 100"
};

export const getParamTitle = (key) => {
  const labels = {
    net_cane_tph: "Net Cane Crushed",
    fibre_tph: "Insoluble Fiber Flow",
    sucrose_tph: "Total Sucrose Tonnage",
    cane_purity_pct: "Cane Purity",
    juice_tph: "Raw Juice Flow",
    imbibition_tph: "Imbibition Water Flow",
    mill_extraction_pct: "Milling Extraction Efficiency",
    juice_brix_pct: "Juice Brix Concentration",
    juice_pol_pct: "Juice Pol Content",
    bagasse_wet_tph: "Wet Bagasse Bypass",
    clarified_juice_tph: "Clarified Juice Tonnage",
    mud_tph: "Settled Mud Flow",
    estimated_ph: "Defecation pH",
    clarified_purity_pct: "Clarified Juice Purity",
    turbidity_reduction_pct: "Turbidity Reduction",
    syrup_out_tph: "Syrup Output Tonnage",
    juice_brix_out_pct: "Syrup Brix (Out)",
    water_evaporated_tph: "Water Evaporated",
    actual_steam_needed_tph: "Boiler Steam Needed",
    massecuite_brix_pct: "Massecuite Brix",
    pan_temp_c: "Boiling Temperature",
    crystal_yield_pct: "Crystal Yield Ratio",
    crystal_tph: "Pure Crystal Flow",
    molasses_tph: "Mother Liquor Molasses",
    massecuite_tph: "Total Massecuite Slurry",
    sugar_tph: "Final Sugar Production Rate",
    molasses_tph_out: "Separated Molasses Out",
    g_factor: "Centrifuge G-Force",
    separation_efficiency_pct: "Separation Efficiency",
    final_sugar_purity_pct: "Final Sugar Purity",
    overall_recovery: "Overall Sugar Recovery"
  };
  
  // Check inputStructure
  for (const group of inputStructure) {
    const param = group.params.find(p => p.key === key);
    if (param) return param.label;
  }
  return labels[key] || key.replace(/_/g, ' ');
};
