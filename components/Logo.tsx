import Image from "next/image";

export default function Logo() {
  return (
    <div className="relative h-8 w-40">
      <Image
        src="/te-logo-light.png"
        alt="Tech Educators"
        fill
        priority
        sizes="160px"
        className="object-contain object-left dark:hidden"
      />
      <Image
        src="/te-logo-dark.png"
        alt="Tech Educators"
        fill
        priority
        sizes="160px"
        className="hidden object-contain object-left dark:block"
      />
    </div>
  );
}
