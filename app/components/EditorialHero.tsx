import Image from "next/image";

type EditorialHeroProps = {
  title: string;
  description: string;
  image: string;
  alt: string;
  tone?: "cyan" | "orange" | "teal";
};

export function EditorialHero({ title, description, image, alt, tone = "cyan" }: EditorialHeroProps) {
  return (
    <section className={`page-hero page-hero-${tone}`} aria-labelledby="page-title">
      <figure>
        <Image src={image} alt={alt} fill priority sizes="100vw" />
        <figcaption>场景示意图</figcaption>
      </figure>
      <div className="page-hero-title">
        <h1 id="page-title">{title}</h1>
      </div>
      <p>{description}</p>
    </section>
  );
}
