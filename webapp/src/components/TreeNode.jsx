export default function TreeNode({ node }) {
  if (!node) return null

  return (
    <li>
      <article className="treeNode">
        <h4>{node.label}</h4>
        <p>{node.meta}</p>
      </article>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={`${child.label}-${child.meta}`} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
