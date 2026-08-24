import { vogelNaam } from '../../utils/birdUtils'

function splitLabel(bird) {
  const values = [bird.Split1, bird.Split2, bird.Split3, bird.Split4].filter(Boolean)
  if (values.length > 0) return values.join(', ')
  return bird.Split || '-'
}

export default function BirdOverview({ birds, coupleForm }) {
  // Filter to show only the selected male and female
  const relevantBirds = []

  if (coupleForm.man) {
    const maleBird = Object.values(birds).find((b) => vogelNaam(b) === coupleForm.man)
    if (maleBird) {
      relevantBirds.push({ name: coupleForm.man, bird: maleBird, role: 'Man' })
    }
  }

  if (coupleForm.pop) {
    const femaleBird = Object.values(birds).find((b) => vogelNaam(b) === coupleForm.pop)
    if (femaleBird) {
      relevantBirds.push({ name: coupleForm.pop, bird: femaleBird, role: 'Pop' })
    }
  }

  if (relevantBirds.length === 0) {
    return null
  }

  return (
    <article className="card">
      <h2>Vogeloverzicht voor koppel</h2>
      <div className="birdOverviewTable">
        <table>
          <thead>
            <tr>
              <th>Rol</th>
              <th>Naam</th>
              <th>Geslacht</th>
              <th>Mutatie</th>
              <th>Factor</th>
              <th>Split</th>
              <th>Jaar</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {relevantBirds.map(({ name, bird, role }) => (
              <tr key={name}>
                <td>{role}</td>
                <td>{vogelNaam(bird)}</td>
                <td>{bird.Geslacht || '-'}</td>
                <td>{bird.Mutatie || '-'}</td>
                <td>{bird.Factor || '-'}</td>
                <td>{splitLabel(bird)}</td>
                <td>{bird.Kweekjaar || '-'}</td>
                <td>{bird.Status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
