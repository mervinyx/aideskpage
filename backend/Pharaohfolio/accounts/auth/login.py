from django.contrib.auth import authenticate
from ..models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt

#the login route
@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    try:
        user_username_mail = request.data.get('username')
        password = request.data.get('password')

        if not user_username_mail or not password:
            return Response(
                {'error': '请输入账号和密码'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = None

        # Check if the input is a username or email
        if '@' not in user_username_mail:
            # Authenticate using username
            user = authenticate(username=user_username_mail, password=password)
        else:
            # Authenticate using email - first find user by email, then authenticate with username
            try:
                user_obj = User.objects.filter(email=user_username_mail).first()
                if user_obj:
                    user = authenticate(username=user_obj.username, password=password)
            except Exception as e:
                return Response(
                    {'error': '数据库连接异常'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            return Response(
                {'error': '账号或密码错误'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    except Exception as e:
        return Response(
            {'error': '登录失败，请稍后重试'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
