export default function TabNavigation({ activeTab, onTabChange }) {
  return (
    <nav className="tabs">
      <button type="button" className={activeTab === 'vogels' ? 'active' : ''} onClick={() => onTabChange('vogels')}>
        Vogels
      </button>
      <button type="button" className={activeTab === 'koppels' ? 'active' : ''} onClick={() => onTabChange('koppels')}>
        Koppels
      </button>
      <button
        type="button"
        className={activeTab === 'stamboom' ? 'active' : ''}
        onClick={() => onTabChange('stamboom')}
      >
        Stamboom
      </button>
      <button
        type="button"
        className={activeTab === 'contacten' ? 'active' : ''}
        onClick={() => onTabChange('contacten')}
      >
        Contacten
      </button>
      <button
        type="button"
        className={activeTab === 'splendid-calculator' ? 'active' : ''}
        onClick={() => onTabChange('splendid-calculator')}
      >
        Splendid Calculator
      </button>
      <button
        type="button"
        className={activeTab === 'beheer' ? 'active' : ''}
        onClick={() => onTabChange('beheer')}
      >
        Beheer
      </button>
    </nav>
  )
}
