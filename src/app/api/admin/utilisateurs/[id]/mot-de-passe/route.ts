import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { updateUserPassword } from "@/lib/storage";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ message: "Accès administrateur requis." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { mot_de_passe?: string };
  const motDePasse = body.mot_de_passe?.trim();

  if (!motDePasse || motDePasse.length < 8) {
    return NextResponse.json({ message: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  const utilisateur = await updateUserPassword(id, await hashPassword(motDePasse));
  if (!utilisateur) {
    return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    succes: true,
    message: "Mot de passe mis à jour.",
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
      date_creation: utilisateur.date_creation
    }
  });
}