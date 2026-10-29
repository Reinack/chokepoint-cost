/**
 * Origin/destination ports.
 *
 * `anchors` are the waypoints a port connects to. `river` marks ports reached
 * through an estuary or river passage — the network validator skips those legs
 * because they legitimately run over what coastline data calls land.
 */

export type PortRegion =
  | 'north-europe'
  | 'mediterranean'
  | 'black-sea'
  | 'middle-east'
  | 'south-asia'
  | 'southeast-asia'
  | 'east-asia'
  | 'oceania'
  | 'africa'
  | 'north-america'
  | 'latin-america'

export interface Port {
  id: string
  name: string
  country: string
  region: PortRegion
  lat: number
  lon: number
  anchors: string[]
  river?: boolean
  /** In the EU ETS maritime scope (EU27 + Norway + Iceland). */
  eea?: boolean
}

export const PORTS: Port[] = [
  // ── Northern Europe ────────────────────────────────────────────────────
  { id: 'rotterdam', name: 'Rotterdam', country: 'NL', region: 'north-europe', lat: 51.95, lon: 4.05, anchors: ['north-sea-sw'], eea: true },
  { id: 'antwerp', name: 'Antwerpen', country: 'BE', region: 'north-europe', lat: 51.3, lon: 4.28, anchors: ['north-sea-sw'], river: true, eea: true },
  { id: 'hamburg', name: 'Hamburg', country: 'DE', region: 'north-europe', lat: 53.54, lon: 9.97, anchors: ['elbe-mouth'], river: true, eea: true },
  { id: 'bremerhaven', name: 'Bremerhaven', country: 'DE', region: 'north-europe', lat: 53.55, lon: 8.58, anchors: ['german-bight'], river: true, eea: true },
  { id: 'wilhelmshaven', name: 'Wilhelmshaven', country: 'DE', region: 'north-europe', lat: 53.6, lon: 8.13, anchors: ['german-bight'], river: true, eea: true },
  { id: 'london-gateway', name: 'London Gateway', country: 'GB', region: 'north-europe', lat: 51.51, lon: 0.48, anchors: ['dover-strait'], river: true },
  { id: 'felixstowe', name: 'Felixstowe', country: 'GB', region: 'north-europe', lat: 51.95, lon: 1.31, anchors: ['north-sea-sw'], river: true },
  { id: 'southampton', name: 'Southampton', country: 'GB', region: 'north-europe', lat: 50.9, lon: -1.4, anchors: ['channel-e'], river: true },
  { id: 'liverpool', name: 'Liverpool', country: 'GB', region: 'north-europe', lat: 53.45, lon: -3.0, anchors: ['irish-sea'], river: true },
  { id: 'dublin', name: 'Dublin', country: 'IE', region: 'north-europe', lat: 53.35, lon: -6.2, anchors: ['irish-sea'], river: true, eea: true },
  { id: 'le-havre', name: 'Le Havre', country: 'FR', region: 'north-europe', lat: 49.48, lon: 0.11, anchors: ['channel-e'], river: true, eea: true },
  { id: 'dunkirk', name: 'Dunkerque', country: 'FR', region: 'north-europe', lat: 51.05, lon: 2.37, anchors: ['dover-strait'], eea: true },
  { id: 'gothenburg', name: 'Göteborg', country: 'SE', region: 'north-europe', lat: 57.69, lon: 11.87, anchors: ['kattegat'], river: true, eea: true },
  { id: 'copenhagen', name: 'København', country: 'DK', region: 'north-europe', lat: 55.7, lon: 12.6, anchors: ['kattegat'], river: true, eea: true },
  { id: 'gdansk', name: 'Gdańsk', country: 'PL', region: 'north-europe', lat: 54.4, lon: 18.68, anchors: ['baltic-s'], river: true, eea: true },
  { id: 'klaipeda', name: 'Klaipėda', country: 'LT', region: 'north-europe', lat: 55.7, lon: 21.13, anchors: ['baltic-c'], river: true, eea: true },
  { id: 'riga', name: 'Rīga', country: 'LV', region: 'north-europe', lat: 57.0, lon: 24.05, anchors: ['baltic-c'], river: true, eea: true },
  { id: 'st-petersburg', name: 'Sankt-Peterburg', country: 'RU', region: 'north-europe', lat: 59.9, lon: 30.25, anchors: ['gulf-finland'], river: true },
  { id: 'helsinki', name: 'Helsinki', country: 'FI', region: 'north-europe', lat: 60.15, lon: 24.95, anchors: ['gulf-finland'], river: true, eea: true },
  { id: 'stockholm', name: 'Stockholm', country: 'SE', region: 'north-europe', lat: 59.32, lon: 18.07, anchors: ['aland', 'baltic-c'], river: true, eea: true },
  { id: 'oslo', name: 'Oslo', country: 'NO', region: 'north-europe', lat: 59.9, lon: 10.75, anchors: ['skagerrak'], river: true, eea: true },
  { id: 'bergen', name: 'Bergen', country: 'NO', region: 'north-europe', lat: 60.39, lon: 5.32, anchors: ['norwegian-sea', 'north-sea-n'], river: true, eea: true },
  { id: 'murmansk', name: 'Murmansk', country: 'RU', region: 'north-europe', lat: 68.97, lon: 33.08, anchors: ['barents', 'north-cape'], river: true },
  { id: 'reykjavik', name: 'Reykjavík', country: 'IS', region: 'north-europe', lat: 64.15, lon: -21.94, anchors: ['iceland-s'], river: true, eea: true },
  { id: 'bilbao', name: 'Bilbao', country: 'ES', region: 'north-europe', lat: 43.35, lon: -3.03, anchors: ['biscay'], river: true, eea: true },
  { id: 'leixoes', name: 'Leixões', country: 'PT', region: 'north-europe', lat: 41.18, lon: -8.7, anchors: ['iberia-nw', 'iberia-w'], eea: true },
  { id: 'lisbon', name: 'Lisboa', country: 'PT', region: 'north-europe', lat: 38.71, lon: -9.14, anchors: ['iberia-w'], river: true, eea: true },

  // ── Mediterranean ──────────────────────────────────────────────────────
  { id: 'algeciras', name: 'Algeciras', country: 'ES', region: 'mediterranean', lat: 36.13, lon: -5.44, anchors: ['gibraltar'], river: true, eea: true },
  { id: 'tanger-med', name: 'Tanger Med', country: 'MA', region: 'mediterranean', lat: 35.88, lon: -5.5, anchors: ['gibraltar'], river: true },
  { id: 'valencia', name: 'València', country: 'ES', region: 'mediterranean', lat: 39.44, lon: -0.31, anchors: ['cabo-nao'], eea: true },
  { id: 'barcelona', name: 'Barcelona', country: 'ES', region: 'mediterranean', lat: 41.35, lon: 2.17, anchors: ['med-balearic'], eea: true },
  { id: 'marseille', name: 'Marseille-Fos', country: 'FR', region: 'mediterranean', lat: 43.34, lon: 5.35, anchors: ['med-balearic'], eea: true },
  { id: 'genoa', name: 'Genova', country: 'IT', region: 'mediterranean', lat: 44.4, lon: 8.92, anchors: ['tyrrhenian'], eea: true },
  { id: 'gioia-tauro', name: 'Gioia Tauro', country: 'IT', region: 'mediterranean', lat: 38.45, lon: 15.9, anchors: ['tyrrhenian'], eea: true },
  { id: 'trieste', name: 'Trieste', country: 'IT', region: 'mediterranean', lat: 45.65, lon: 13.76, anchors: ['adriatic-n'], river: true, eea: true },
  { id: 'piraeus', name: 'Peiraiás', country: 'GR', region: 'mediterranean', lat: 37.94, lon: 23.64, anchors: ['saronic'], river: true, eea: true },
  { id: 'alexandria', name: 'Al-Iskandariyah', country: 'EG', region: 'mediterranean', lat: 31.2, lon: 29.9, anchors: ['med-e'] },
  { id: 'haifa', name: 'Haifa', country: 'IL', region: 'mediterranean', lat: 32.82, lon: 35.0, anchors: ['cyprus-s'] },
  { id: 'mersin', name: 'Mersin', country: 'TR', region: 'mediterranean', lat: 36.8, lon: 34.63, anchors: ['cyprus-e'] },

  // ── Black Sea and Turkish Straits ──────────────────────────────────────
  { id: 'istanbul', name: 'İstanbul-Ambarlı', country: 'TR', region: 'black-sea', lat: 40.96, lon: 28.69, anchors: ['marmara'] },
  { id: 'constanta', name: 'Constanța', country: 'RO', region: 'black-sea', lat: 44.17, lon: 28.65, anchors: ['black-sea-w'], eea: true },
  { id: 'odesa', name: 'Odesa', country: 'UA', region: 'black-sea', lat: 46.48, lon: 30.73, anchors: ['black-sea-w'] },
  { id: 'novorossiysk', name: 'Novorossiysk', country: 'RU', region: 'black-sea', lat: 44.72, lon: 37.79, anchors: ['black-sea-e'] },

  // ── Middle East ────────────────────────────────────────────────────────
  { id: 'port-sudan', name: 'Būr Sūdān', country: 'SD', region: 'middle-east', lat: 19.6, lon: 37.22, anchors: ['red-sea-c'] },
  { id: 'jeddah', name: 'Jiddah', country: 'SA', region: 'middle-east', lat: 21.48, lon: 39.18, anchors: ['red-sea-c'] },
  { id: 'djibouti', name: 'Djibouti', country: 'DJ', region: 'middle-east', lat: 11.6, lon: 43.15, anchors: ['bab-el-mandeb'], river: true },
  { id: 'salalah', name: 'Salālah', country: 'OM', region: 'middle-east', lat: 16.95, lon: 54.01, anchors: ['socotra-off'] },
  { id: 'jebel-ali', name: 'Jebel Ali', country: 'AE', region: 'middle-east', lat: 25.01, lon: 55.06, anchors: ['persian-gulf-e'] },
  { id: 'bandar-abbas', name: 'Bandar Abbās', country: 'IR', region: 'middle-east', lat: 27.15, lon: 56.2, anchors: ['hormuz'] },
  { id: 'ras-tanura', name: 'Ras Tanura', country: 'SA', region: 'middle-east', lat: 26.65, lon: 50.16, anchors: ['persian-gulf-w', 'persian-gulf-e'] },
  { id: 'umm-qasr', name: 'Umm Qasr', country: 'IQ', region: 'middle-east', lat: 30.03, lon: 47.92, anchors: ['persian-gulf-w'], river: true },

  // ── South Asia ─────────────────────────────────────────────────────────
  { id: 'karachi', name: 'Karachi', country: 'PK', region: 'south-asia', lat: 24.84, lon: 66.98, anchors: ['arabian-sea-e'], river: true },
  { id: 'mundra', name: 'Mundra', country: 'IN', region: 'south-asia', lat: 22.75, lon: 69.7, anchors: ['arabian-sea-e'], river: true },
  { id: 'nhava-sheva', name: 'Nhava Sheva', country: 'IN', region: 'south-asia', lat: 18.95, lon: 72.95, anchors: ['arabian-sea-e', 'laccadive'], river: true },
  { id: 'colombo', name: 'Colombo', country: 'LK', region: 'south-asia', lat: 6.93, lon: 79.85, anchors: ['sri-lanka-sw', 'laccadive'] },
  { id: 'chennai', name: 'Chennai', country: 'IN', region: 'south-asia', lat: 13.08, lon: 80.28, anchors: ['bengal'] },
  { id: 'chittagong', name: 'Chattogram', country: 'BD', region: 'south-asia', lat: 22.3, lon: 91.8, anchors: ['bengal'], river: true },

  // ── South-east Asia ────────────────────────────────────────────────────
  { id: 'singapore', name: 'Singapore', country: 'SG', region: 'southeast-asia', lat: 1.27, lon: 103.83, anchors: ['singapore-strait'] },
  { id: 'tanjung-pelepas', name: 'Tanjung Pelepas', country: 'MY', region: 'southeast-asia', lat: 1.36, lon: 103.55, anchors: ['singapore-strait'] },
  { id: 'port-klang', name: 'Port Klang', country: 'MY', region: 'southeast-asia', lat: 3.0, lon: 101.4, anchors: ['malacca'] },
  { id: 'laem-chabang', name: 'Laem Chabang', country: 'TH', region: 'southeast-asia', lat: 13.08, lon: 100.88, anchors: ['gulf-thailand'], river: true },
  { id: 'ho-chi-minh', name: 'Cái Mép', country: 'VN', region: 'southeast-asia', lat: 10.4, lon: 107.05, anchors: ['scs-s'], river: true },
  { id: 'manila', name: 'Manila', country: 'PH', region: 'southeast-asia', lat: 14.6, lon: 120.95, anchors: ['scs-n'], river: true },
  { id: 'jakarta', name: 'Tanjung Priok', country: 'ID', region: 'southeast-asia', lat: -6.1, lon: 106.88, anchors: ['java-sea'], river: true },
  { id: 'surabaya', name: 'Surabaya', country: 'ID', region: 'southeast-asia', lat: -7.2, lon: 112.73, anchors: ['java-sea'], river: true },

  // ── East Asia ──────────────────────────────────────────────────────────
  { id: 'hong-kong', name: 'Hong Kong', country: 'HK', region: 'east-asia', lat: 22.3, lon: 114.15, anchors: ['scs-n'] },
  { id: 'shenzhen', name: 'Shenzhen-Yantian', country: 'CN', region: 'east-asia', lat: 22.58, lon: 114.27, anchors: ['scs-n'] },
  { id: 'guangzhou', name: 'Guangzhou-Nansha', country: 'CN', region: 'east-asia', lat: 22.7, lon: 113.6, anchors: ['scs-n'], river: true },
  { id: 'xiamen', name: 'Xiamen', country: 'CN', region: 'east-asia', lat: 24.45, lon: 118.08, anchors: ['taiwan-strait'], river: true },
  { id: 'kaohsiung', name: 'Kaohsiung', country: 'TW', region: 'east-asia', lat: 22.6, lon: 120.28, anchors: ['taiwan-strait', 'luzon-strait'] },
  { id: 'shanghai', name: 'Shanghai-Yangshan', country: 'CN', region: 'east-asia', lat: 30.62, lon: 122.07, anchors: ['east-china-sea'] },
  { id: 'ningbo', name: 'Ningbo-Zhoushan', country: 'CN', region: 'east-asia', lat: 29.93, lon: 121.85, anchors: ['east-china-sea'], river: true },
  { id: 'qingdao', name: 'Qingdao', country: 'CN', region: 'east-asia', lat: 36.07, lon: 120.32, anchors: ['yellow-sea'], river: true },
  { id: 'tianjin', name: 'Tianjin', country: 'CN', region: 'east-asia', lat: 38.98, lon: 117.75, anchors: ['bohai-strait'] },
  { id: 'dalian', name: 'Dalian', country: 'CN', region: 'east-asia', lat: 38.92, lon: 121.63, anchors: ['bohai-strait'] },
  { id: 'busan', name: 'Busan', country: 'KR', region: 'east-asia', lat: 35.1, lon: 129.05, anchors: ['korea-strait'] },
  { id: 'gwangyang', name: 'Gwangyang', country: 'KR', region: 'east-asia', lat: 34.9, lon: 127.75, anchors: ['korea-strait'], river: true },
  { id: 'incheon', name: 'Incheon', country: 'KR', region: 'east-asia', lat: 37.45, lon: 126.6, anchors: ['yellow-sea'], river: true },
  { id: 'tokyo', name: 'Tōkyō-Yokohama', country: 'JP', region: 'east-asia', lat: 35.45, lon: 139.8, anchors: ['tokyo-off'], river: true },
  { id: 'nagoya', name: 'Nagoya', country: 'JP', region: 'east-asia', lat: 35.05, lon: 136.85, anchors: ['japan-s'], river: true },
  { id: 'kobe', name: 'Kōbe', country: 'JP', region: 'east-asia', lat: 34.68, lon: 135.2, anchors: ['japan-s'], river: true },
  { id: 'vladivostok', name: 'Vladivostok', country: 'RU', region: 'east-asia', lat: 43.1, lon: 131.9, anchors: ['japan-sea'], river: true },

  // ── Oceania ────────────────────────────────────────────────────────────
  { id: 'port-hedland', name: 'Port Hedland', country: 'AU', region: 'oceania', lat: -20.31, lon: 118.58, anchors: ['australia-w'] },
  { id: 'fremantle', name: 'Fremantle', country: 'AU', region: 'oceania', lat: -32.05, lon: 115.75, anchors: ['wa-coast', 'io-s'] },
  { id: 'melbourne', name: 'Melbourne', country: 'AU', region: 'oceania', lat: -37.85, lon: 144.9, anchors: ['bass-strait'], river: true },
  { id: 'sydney', name: 'Sydney-Botany', country: 'AU', region: 'oceania', lat: -33.96, lon: 151.21, anchors: ['sydney-off'] },
  { id: 'brisbane', name: 'Brisbane', country: 'AU', region: 'oceania', lat: -27.38, lon: 153.17, anchors: ['brisbane-off'], river: true },
  { id: 'darwin', name: 'Darwin', country: 'AU', region: 'oceania', lat: -12.45, lon: 130.85, anchors: ['darwin-off'], river: true },
  { id: 'auckland', name: 'Auckland', country: 'NZ', region: 'oceania', lat: -36.84, lon: 174.77, anchors: ['nz-n'], river: true },
  { id: 'guam', name: 'Apra Harbor', country: 'GU', region: 'oceania', lat: 13.44, lon: 144.66, anchors: ['guam-off'], river: true },

  // ── Africa ─────────────────────────────────────────────────────────────
  { id: 'casablanca', name: 'Casablanca', country: 'MA', region: 'africa', lat: 33.6, lon: -7.62, anchors: ['cape-st-vincent'] },
  { id: 'abidjan', name: 'Abidjan', country: 'CI', region: 'africa', lat: 5.25, lon: -4.02, anchors: ['guinea-gulf-w'] },
  { id: 'lagos', name: 'Lagos-Apapa', country: 'NG', region: 'africa', lat: 6.44, lon: 3.38, anchors: ['gulf-guinea'], river: true },
  { id: 'luanda', name: 'Luanda', country: 'AO', region: 'africa', lat: -8.81, lon: 13.23, anchors: ['angola-off'] },
  { id: 'walvis-bay', name: 'Walvis Bay', country: 'NA', region: 'africa', lat: -22.95, lon: 14.5, anchors: ['namibia-off'] },
  { id: 'cape-town', name: 'Cape Town', country: 'ZA', region: 'africa', lat: -33.9, lon: 18.42, anchors: ['cape-point'], river: true },
  { id: 'durban', name: 'Durban', country: 'ZA', region: 'africa', lat: -29.87, lon: 31.05, anchors: ['durban-off'] },
  { id: 'dar-es-salaam', name: 'Dar es Salaam', country: 'TZ', region: 'africa', lat: -6.82, lon: 39.28, anchors: ['mozambique-n'], river: true },
  { id: 'mombasa', name: 'Mombasa', country: 'KE', region: 'africa', lat: -4.05, lon: 39.67, anchors: ['mombasa-off'], river: true },

  // ── North America ──────────────────────────────────────────────────────
  { id: 'montreal', name: 'Montréal', country: 'CA', region: 'north-america', lat: 45.5, lon: -73.55, anchors: ['st-lawrence'], river: true },
  { id: 'halifax', name: 'Halifax', country: 'CA', region: 'north-america', lat: 44.65, lon: -63.57, anchors: ['halifax-off'] },
  { id: 'new-york', name: 'New York-New Jersey', country: 'US', region: 'north-america', lat: 40.67, lon: -74.03, anchors: ['ny-off'], river: true },
  { id: 'norfolk', name: 'Norfolk', country: 'US', region: 'north-america', lat: 36.92, lon: -76.33, anchors: ['us-east'], river: true },
  { id: 'charleston', name: 'Charleston', country: 'US', region: 'north-america', lat: 32.78, lon: -79.92, anchors: ['us-east'], river: true },
  { id: 'savannah', name: 'Savannah', country: 'US', region: 'north-america', lat: 32.08, lon: -81.1, anchors: ['us-east'], river: true },
  { id: 'miami', name: 'Miami', country: 'US', region: 'north-america', lat: 25.77, lon: -80.18, anchors: ['miami-off'] },
  { id: 'houston', name: 'Houston', country: 'US', region: 'north-america', lat: 29.73, lon: -95.27, anchors: ['gulf-mexico'], river: true },
  { id: 'new-orleans', name: 'New Orleans', country: 'US', region: 'north-america', lat: 29.95, lon: -90.07, anchors: ['gulf-mexico'], river: true },
  { id: 'veracruz', name: 'Veracruz', country: 'MX', region: 'north-america', lat: 19.2, lon: -96.13, anchors: ['gulf-mexico'] },
  { id: 'manzanillo-mx', name: 'Manzanillo', country: 'MX', region: 'north-america', lat: 19.05, lon: -104.32, anchors: ['mexico-w'], river: true },
  { id: 'los-angeles', name: 'Los Angeles-Long Beach', country: 'US', region: 'north-america', lat: 33.74, lon: -118.26, anchors: ['california'], river: true },
  { id: 'oakland', name: 'Oakland', country: 'US', region: 'north-america', lat: 37.8, lon: -122.33, anchors: ['california-n'], river: true },
  { id: 'seattle-tacoma', name: 'Seattle-Tacoma', country: 'US', region: 'north-america', lat: 47.27, lon: -122.41, anchors: ['us-nw'], river: true },
  { id: 'vancouver', name: 'Vancouver', country: 'CA', region: 'north-america', lat: 49.29, lon: -123.11, anchors: ['us-nw'], river: true },
  { id: 'honolulu', name: 'Honolulu', country: 'US', region: 'north-america', lat: 21.31, lon: -157.87, anchors: ['hawaii-off'], river: true },

  // ── Latin America ──────────────────────────────────────────────────────
  { id: 'colon', name: 'Colón', country: 'PA', region: 'latin-america', lat: 9.36, lon: -79.9, anchors: ['panama-atl'], river: true },
  { id: 'balboa', name: 'Balboa', country: 'PA', region: 'latin-america', lat: 8.95, lon: -79.57, anchors: ['panama-pac'] },
  { id: 'cartagena-co', name: 'Cartagena', country: 'CO', region: 'latin-america', lat: 10.4, lon: -75.53, anchors: ['caribbean-c', 'caribbean-sw'], river: true },
  { id: 'kingston', name: 'Kingston', country: 'JM', region: 'latin-america', lat: 17.97, lon: -76.79, anchors: ['jamaica-e'], river: true },
  { id: 'recife', name: 'Suape-Recife', country: 'BR', region: 'latin-america', lat: -8.05, lon: -34.87, anchors: ['brazil-ne'] },
  { id: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'BR', region: 'latin-america', lat: -22.9, lon: -43.18, anchors: ['santos-off'] },
  { id: 'santos', name: 'Santos', country: 'BR', region: 'latin-america', lat: -23.95, lon: -46.33, anchors: ['santos-off'], river: true },
  { id: 'paranagua', name: 'Paranaguá', country: 'BR', region: 'latin-america', lat: -25.5, lon: -48.52, anchors: ['santos-off'], river: true },
  { id: 'montevideo', name: 'Montevideo', country: 'UY', region: 'latin-america', lat: -34.9, lon: -56.2, anchors: ['plata'] },
  { id: 'buenos-aires', name: 'Buenos Aires', country: 'AR', region: 'latin-america', lat: -34.58, lon: -58.37, anchors: ['plata'], river: true },
  { id: 'valparaiso', name: 'Valparaíso', country: 'CL', region: 'latin-america', lat: -33.03, lon: -71.63, anchors: ['valparaiso-off'] },
  { id: 'callao', name: 'Callao', country: 'PE', region: 'latin-america', lat: -12.05, lon: -77.15, anchors: ['callao-off'] },
  { id: 'guayaquil', name: 'Guayaquil', country: 'EC', region: 'latin-america', lat: -2.28, lon: -79.9, anchors: ['guayaquil-off'], river: true },
]

export const PORT_BY_ID = new Map(PORTS.map((p) => [p.id, p]))

/** Graph node id for a port, namespaced so it can never clash with a waypoint. */
export const portNodeId = (portId: string) => `port:${portId}`

export const isPortNode = (nodeId: string) => nodeId.startsWith('port:')

export const DEFAULT_ORIGIN = 'shanghai'
export const DEFAULT_DESTINATION = 'rotterdam'
