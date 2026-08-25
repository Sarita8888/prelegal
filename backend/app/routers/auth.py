from fastapi import APIRouter, HTTPException, status

from app.schemas import SigninRequest, SignupRequest

router = APIRouter(prefix="/auth", tags=["auth"])

NOT_IMPLEMENTED_DETAIL = "Auth is not implemented yet; this is a foundation stub."


@router.post("/signup", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def signup(payload: SignupRequest) -> None:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail=NOT_IMPLEMENTED_DETAIL)


@router.post("/signin", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def signin(payload: SigninRequest) -> None:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail=NOT_IMPLEMENTED_DETAIL)


@router.post("/signout", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def signout() -> None:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail=NOT_IMPLEMENTED_DETAIL)


@router.get("/me", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_me() -> None:
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, detail=NOT_IMPLEMENTED_DETAIL)
