"""Serviço de cálculo de média — Template Method (spec seção 3.1 e 13).

O Template Method define um fluxo fixo em `calcular()`:
  1. Coletar notas lançadas (etapa fixa)
  2. Aplicar critério de ponderação (etapa variável — implementada nas subclasses)
  3. Retornar resultado (etapa fixa)

Subclasses concretas customizam apenas `_aplicar_criterio()`.
"""

from abc import ABC, abstractmethod


class CalculadoraMedia(ABC):
    """Classe base abstrata — define o Template Method."""

    def calcular(self, notas: list) -> float | None:
        """Fluxo fixo: filtra → pondera → retorna."""
        notas_lancadas = self._filtrar_notas(notas)
        if not notas_lancadas:
            return None
        return self._aplicar_criterio(notas_lancadas)

    # ── Etapas fixas ──────────────────────────────────────────────────────────

    def _filtrar_notas(self, notas: list) -> list:
        """Considera somente notas com valor já lançado."""
        return [n for n in notas if n.valor is not None]

    # ── Etapa variável (hook) ─────────────────────────────────────────────────

    @abstractmethod
    def _aplicar_criterio(self, notas: list) -> float:
        """Subclasses implementam o critério de ponderação."""
        ...


class MediaPonderada(CalculadoraMedia):
    """Média ponderada por peso de avaliação (padrão do sistema)."""

    def _aplicar_criterio(self, notas: list) -> float:
        soma_ponderada = sum(n.valor * n.peso for n in notas)
        soma_pesos = sum(n.peso for n in notas)
        if soma_pesos == 0:
            return 0.0
        return round(soma_ponderada / soma_pesos, 2)


class MediaSimples(CalculadoraMedia):
    """Média aritmética simples (todos os pesos iguais)."""

    def _aplicar_criterio(self, notas: list) -> float:
        return round(sum(n.valor for n in notas) / len(notas), 2)


# Instância padrão — pode ser sobrescrita por disciplina/curso no futuro
calculadora_padrao = MediaPonderada()
